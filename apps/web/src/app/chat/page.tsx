"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type ChatRole = "user" | "assistant" | "system";

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  meta?: { model?: string; provider?: string; reason?: string; memoryInjected?: number };
}

interface ModelInfo {
  id: string;
  provider: string;
  modelId: string;
  displayName: string;
  status: string;
  availability: boolean;
}

function uid() {
  return `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: uid(),
      role: "assistant",
      content:
        "SUPERIOR AI is ready. Ask anything. Memory is used when available; models only show as AVAILABLE after a live health check.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState("auto");
  const [remember, setRemember] = useState(true);
  const [profileId, setProfileId] = useState("local-user");
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadModels = useCallback(async () => {
    try {
      const res = await fetch("/api/models?probe=1");
      const data = await res.json();
      if (Array.isArray(data.models)) setModels(data.models);
    } catch {
      /* non-fatal */
    }
  }, []);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setError(null);
    setInput("");
    const userMsg: ChatMessage = { id: uid(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    try {
      const history = [...messages, userMsg]
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: selectedModel,
          messages: history,
          remember,
          profileId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || data?.error || `HTTP ${res.status}`);
      }
      const content =
        data.choices?.[0]?.message?.content ??
        data.message?.content ??
        "(empty response — check provider configuration)";
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          content,
          meta: {
            model: data.superior_meta?.routed_model ?? data.model,
            provider: data.superior_meta?.provider,
            reason: data.superior_meta?.reason,
            memoryInjected: data.memory?.injected ?? 0,
          },
        },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          content: `Request failed: ${msg}\n\nHonest failure — no fabricated answer. Configure a provider API key in .env and retry.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const available = models.filter((m) => m.availability);
  const unavailable = models.filter((m) => !m.availability);

  return (
    <main
      style={{
        fontFamily: "system-ui, sans-serif",
        maxWidth: 880,
        margin: "0 auto",
        padding: "1.5rem",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <header style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: "1.35rem" }}>SUPERIOR AI · Chat</h1>
          <p style={{ margin: "0.25rem 0 0", color: "#94a3b8", fontSize: 13 }}>
            Memory-aware · model-routed · honest status
          </p>
        </div>
        <a href="/" style={{ fontSize: 13 }}>Home</a>
        <a href="/studio" style={{ fontSize: 13 }}>Studio</a>
        <a href="/sales" style={{ fontSize: 13 }}>Sales</a>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: "0.75rem",
          alignItems: "end",
          background: "#12151c",
          border: "1px solid #1e2430",
          borderRadius: 10,
          padding: "0.75rem 1rem",
        }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "#94a3b8" }}>
          Model
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            style={{
              background: "#0b0d12",
              color: "#e6e8ee",
              border: "1px solid #2a3140",
              borderRadius: 6,
              padding: "0.4rem 0.5rem",
            }}
          >
            <option value="auto">auto (router picks best AVAILABLE)</option>
            {available.map((m) => (
              <option key={m.id} value={m.modelId}>
                {m.displayName} · {m.provider} · AVAILABLE
              </option>
            ))}
            {unavailable.map((m) => (
              <option key={m.id} value={m.modelId} disabled>
                {m.displayName} · {m.status}
              </option>
            ))}
          </select>
        </label>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, color: "#94a3b8" }}>
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            Remember turn
          </label>
          <button
            type="button"
            onClick={loadModels}
            style={{
              background: "#1e293b",
              color: "#e2e8f0",
              border: "1px solid #334155",
              borderRadius: 6,
              padding: "0.35rem 0.6rem",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            Re-probe models
          </button>
        </div>
      </section>

      {models.length > 0 && (
        <div style={{ fontSize: 12, color: "#64748b" }}>
          {available.length} AVAILABLE · {unavailable.length} not ready
          {available.length === 0 && (
            <span style={{ color: "#fbbf24" }}>
              {" "}— set OPENAI_API_KEY / ANTHROPIC_API_KEY / XAI_API_KEY / etc. in .env
            </span>
          )}
        </div>
      )}

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "0.85rem",
          padding: "0.5rem 0",
          minHeight: 320,
        }}
      >
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "88%",
              background: m.role === "user" ? "#1d4ed8" : "#151922",
              border: m.role === "user" ? "none" : "1px solid #1e2430",
              borderRadius: 12,
              padding: "0.75rem 1rem",
              whiteSpace: "pre-wrap",
              lineHeight: 1.5,
              fontSize: 14,
            }}
          >
            {m.content}
            {m.meta && (m.meta.model || m.meta.memoryInjected) ? (
              <div style={{ marginTop: 8, fontSize: 11, color: "#64748b" }}>
                {m.meta.model && (
                  <span>
                    {m.meta.provider ? `${m.meta.provider}/` : ""}
                    {m.meta.model}
                  </span>
                )}
                {typeof m.meta.memoryInjected === "number" && m.meta.memoryInjected > 0 && (
                  <span> · memory ×{m.meta.memoryInjected}</span>
                )}
              </div>
            ) : null}
          </div>
        ))}
        {loading && (
          <div style={{ color: "#94a3b8", fontSize: 13, padding: "0.25rem 0.5rem" }}>
            Routing & generating…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div
          style={{
            background: "#3f1d1d",
            border: "1px solid #7f1d1d",
            color: "#fecaca",
            borderRadius: 8,
            padding: "0.6rem 0.85rem",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
        style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}
      >
        <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "#94a3b8" }}>
          Message
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            rows={3}
            placeholder="Describe a goal, ask a question, or request research…"
            style={{
              width: "100%",
              resize: "vertical",
              background: "#12151c",
              color: "#e6e8ee",
              border: "1px solid #2a3140",
              borderRadius: 10,
              padding: "0.75rem 0.9rem",
              fontFamily: "inherit",
              fontSize: 14,
              lineHeight: 1.45,
            }}
          />
        </label>
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            background: loading || !input.trim() ? "#1e293b" : "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "0.85rem 1.25rem",
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          Send
        </button>
      </form>

      <footer style={{ fontSize: 11, color: "#475569", paddingBottom: "1rem" }}>
        Profile id for memory:{" "}
        <input
          value={profileId}
          onChange={(e) => setProfileId(e.target.value)}
          style={{
            background: "transparent",
            border: "1px solid #2a3140",
            color: "#94a3b8",
            borderRadius: 4,
            padding: "0.15rem 0.4rem",
            fontSize: 11,
          }}
        />{" "}
        · No token meters · Failures reported honestly
      </footer>
    </main>
  );
}
