"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Mode = "chat" | "orchestrate" | "research";
type ChatRole = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  meta?: Record<string, unknown>;
}

interface ModelInfo {
  id: string;
  provider: string;
  modelId: string;
  displayName: string;
  status: string;
  availability: boolean;
}

const uid = () => `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const box = {
  fontFamily: "system-ui, sans-serif",
  maxWidth: 920,
  margin: "0 auto",
  padding: "1.5rem",
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column" as const,
  gap: "0.85rem",
};

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: uid(),
      role: "assistant",
      content:
        "SUPERIOR AI ready. Modes: Chat (memory+RAG), Orchestrate (plan\u2192synthesis), Research (fetch URLs + cite).",
    },
  ]);
  const [input, setInput] = useState("");
  const [urls, setUrls] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState("auto");
  const [mode, setMode] = useState<Mode>("chat");
  const [remember, setRemember] = useState(true);
  const [profileId, setProfileId] = useState("local-user");
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadModels = useCallback(async () => {
    try {
      const res = await fetch("/api/models?probe=1");
      const data = await res.json();
      if (Array.isArray(data.models)) setModels(data.models);
    } catch { /* non-fatal */ }
  }, []);

  useEffect(() => { loadModels(); }, [loadModels]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  async function sendChat(text: string, history: ChatMessage[]) {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: selectedModel,
        messages: history
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({ role: m.role, content: m.content })),
        remember,
        profileId,
        useMemory: true,
        useRag: true,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || data?.error || `HTTP ${res.status}`);
    return {
      content: data.choices?.[0]?.message?.content ?? "(empty \u2014 check provider config)",
      meta: {
        mode: "chat",
        model: data.superior_meta?.routed_model ?? data.model,
        provider: data.superior_meta?.provider,
        memoryInjected: data.memory?.injected ?? 0,
        ragChunks: data.memory?.ragChunks ?? 0,
        backend: data.memory?.backend,
      },
    };
  }

  async function sendOrchestrate(text: string) {
    const res = await fetch("/api/orchestrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ objective: text, mode: "execute", model: selectedModel }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
    const steps = (data.steps ?? [])
      .map((s: { order: number; agent: string; action: string; status: string }) =>
        `${s.order}. [${s.agent}] (${s.status}) ${s.action}`)
      .join("\n");
    const notes = (data.notes ?? []).map((n: string) => `\u2022 ${n}`).join("\n");
    const synthesis = data.synthesis?.content
      ? `\n\n--- Synthesis (${data.synthesis.provider ?? "?"}/${data.synthesis.model ?? "?"}) ---\n${data.synthesis.content}`
      : "\n\n(No synthesis \u2014 plan only or model unavailable.)";
    return {
      content: `Objective: ${data.objective}\nAgents: ${(data.agentsAssigned ?? []).join(", ") || "none"}\n\nPlan:\n${steps}\n\nNotes:\n${notes}${synthesis}`,
      meta: { mode: "orchestrate", model: data.synthesis?.model, provider: data.synthesis?.provider },
    };
  }

  async function sendResearch(text: string) {
    const urlList = urls.split(/[\n,]+/).map((u) => u.trim()).filter(Boolean);
    const res = await fetch("/api/research", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: text,
        urls: urlList,
        synthesize: true,
        model: selectedModel,
        remember,
        profileId,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
    const sourceLines = (data.sources ?? [])
      .map((s: { url: string; ok: boolean; title?: string; statusCode?: number; error?: string }) =>
        s.ok ? `\u2713 ${s.url}${s.title ? ` \u2014 ${s.title}` : ""} (${s.statusCode})` : `\u2717 ${s.url} \u2014 ${s.error ?? "failed"}`)
      .join("\n");
    const claims = (data.claims ?? [])
      .map((c: { claim: string; sourceUrls: string[]; confidence: string }) =>
        `\u2022 [${c.confidence}] ${c.claim}\n  sources: ${c.sourceUrls.join(", ")}`)
      .join("\n");
    const notes = (data.notes ?? []).map((n: string) => `\u2022 ${n}`).join("\n");
    const synthesis = data.synthesis?.content
      ? `\n\n--- Answer (${data.synthesis.provider ?? "?"}/${data.synthesis.model ?? "?"}) ---\n${data.synthesis.content}`
      : "\n\n(No synthesis \u2014 provide reachable public URLs, or model not configured.)";
    return {
      content: `Query: ${data.query}\n\nSources:\n${sourceLines || "(none)"}\n\nExtracted evidence:\n${claims || "(none)"}\n\nNotes:\n${notes}${synthesis}`,
      meta: { mode: "research", model: data.synthesis?.model, provider: data.synthesis?.provider },
    };
  }

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setError(null);
    setInput("");
    const userMsg: ChatMessage = { id: uid(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    try {
      const history = [...messages, userMsg];
      const result =
        mode === "orchestrate"
          ? await sendOrchestrate(text)
          : mode === "research"
            ? await sendResearch(text)
            : await sendChat(text, history);
      setMessages((prev) => [...prev, { id: uid(), role: "assistant", content: result.content, meta: result.meta }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "assistant", content: `Request failed: ${msg}\n\nHonest failure \u2014 no fabricated answer.` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const available = models.filter((m) => m.availability);
  const unavailable = models.filter((m) => !m.availability);

  return (
    <main style={box}>
      <header style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: "1.35rem" }}>SUPERIOR AI \u00b7 Command</h1>
          <p style={{ margin: "0.25rem 0 0", color: "#94a3b8", fontSize: 13 }}>
            Chat \u00b7 Orchestrate \u00b7 Research \u2014 memory + RAG by default
          </p>
        </div>
        <a href="/" style={{ fontSize: 13 }}>Home</a>
        <a href="/studio" style={{ fontSize: 13 }}>Studio</a>
        <a href="/sales" style={{ fontSize: 13 }}>Sales</a>
      </header>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {(["chat", "orchestrate", "research"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            style={{
              background: mode === m ? "#2563eb" : "#1e293b",
              color: "#e2e8f0",
              border: "1px solid #334155",
              borderRadius: 8,
              padding: "0.4rem 0.85rem",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: mode === m ? 600 : 400,
              textTransform: "capitalize",
            }}
          >
            {m}
          </button>
        ))}
      </div>

      <section style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "0.75rem", alignItems: "end", background: "#12151c", border: "1px solid #1e2430", borderRadius: 10, padding: "0.75rem 1rem" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "#94a3b8" }}>
          Model
          <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} style={{ background: "#0b0d12", color: "#e6e8ee", border: "1px solid #2a3140", borderRadius: 6, padding: "0.4rem 0.5rem" }}>
            <option value="auto">auto (best AVAILABLE)</option>
            {available.map((m) => (
              <option key={m.id} value={m.modelId}>{m.displayName} \u00b7 {m.provider} \u00b7 AVAILABLE</option>
            ))}
            {unavailable.map((m) => (
              <option key={m.id} value={m.modelId} disabled>{m.displayName} \u00b7 {m.status}</option>
            ))}
          </select>
        </label>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, color: "#94a3b8" }}>
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            Remember
          </label>
          <button type="button" onClick={loadModels} style={{ background: "#1e293b", color: "#e2e8f0", border: "1px solid #334155", borderRadius: 6, padding: "0.35rem 0.6rem", cursor: "pointer", fontSize: 12 }}>
            Re-probe
          </button>
        </div>
      </section>

      {mode === "research" && (
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "#94a3b8" }}>
          Public URLs (one per line \u2014 no invented search hits)
          <textarea value={urls} onChange={(e) => setUrls(e.target.value)} rows={2} placeholder="https://example.com/article" style={{ background: "#12151c", color: "#e6e8ee", border: "1px solid #2a3140", borderRadius: 8, padding: "0.5rem 0.75rem", fontFamily: "inherit", fontSize: 13 }} />
        </label>
      )}

      {models.length > 0 && (
        <div style={{ fontSize: 12, color: "#64748b" }}>
          {available.length} AVAILABLE \u00b7 {unavailable.length} not ready
          {available.length === 0 && <span style={{ color: "#fbbf24" }}> \u2014 set provider API keys in .env</span>}
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.85rem", minHeight: 280 }}>
        {messages.map((m) => (
          <div key={m.id} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "90%", background: m.role === "user" ? "#1d4ed8" : "#151922", border: m.role === "user" ? "none" : "1px solid #1e2430", borderRadius: 12, padding: "0.75rem 1rem", whiteSpace: "pre-wrap", lineHeight: 1.5, fontSize: 14 }}>
            {m.content}
            {m.meta && (
              <div style={{ marginTop: 8, fontSize: 11, color: "#64748b" }}>
                {String(m.meta.mode ?? "")}
                {m.meta.model ? ` \u00b7 ${m.meta.provider ? `${m.meta.provider}/` : ""}${m.meta.model}` : ""}
                {typeof m.meta.memoryInjected === "number" && m.meta.memoryInjected > 0 ? ` \u00b7 mem \u00d7${m.meta.memoryInjected}` : ""}
                {typeof m.meta.ragChunks === "number" && m.meta.ragChunks > 0 ? ` \u00b7 rag \u00d7${m.meta.ragChunks}` : ""}
                {m.meta.backend ? ` \u00b7 ${m.meta.backend}` : ""}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ color: "#94a3b8", fontSize: 13 }}>
            {mode === "orchestrate" ? "Planning \u0026 synthesizing\u2026" : mode === "research" ? "Fetching sources\u2026" : "Routing\u2026"}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div style={{ background: "#3f1d1d", border: "1px solid #7f1d1d", color: "#fecaca", borderRadius: 8, padding: "0.6rem 0.85rem", fontSize: 13 }}>{error}</div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); void send(); }} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
        <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "#94a3b8" }}>
          {mode === "orchestrate" ? "Objective" : mode === "research" ? "Research question" : "Message"}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}
            rows={3}
            placeholder={mode === "orchestrate" ? "e.g. Launch an SMB SaaS for invoice automation" : mode === "research" ? "e.g. What does this page say about pricing?" : "Ask anything\u2026"}
            style={{ width: "100%", resize: "vertical", background: "#12151c", color: "#e6e8ee", border: "1px solid #2a3140", borderRadius: 10, padding: "0.75rem 0.9rem", fontFamily: "inherit", fontSize: 14, lineHeight: 1.45 }}
          />
        </label>
        <button type="submit" disabled={loading || !input.trim()} style={{ background: loading || !input.trim() ? "#1e293b" : "#2563eb", color: "#fff", border: "none", borderRadius: 10, padding: "0.85rem 1.25rem", cursor: loading || !input.trim() ? "not-allowed" : "pointer", fontWeight: 600, fontSize: 14 }}>
          {mode === "orchestrate" ? "Run" : mode === "research" ? "Research" : "Send"}
        </button>
      </form>

      <footer style={{ fontSize: 11, color: "#475569", paddingBottom: "1rem" }}>
        Profile:{" "}
        <input value={profileId} onChange={(e) => setProfileId(e.target.value)} style={{ background: "transparent", border: "1px solid #2a3140", color: "#94a3b8", borderRadius: 4, padding: "0.15rem 0.4rem", fontSize: 11 }} />{" "}
        \u00b7 Failures reported honestly \u00b7 No invented citations
      </footer>
    </main>
  );
}
