"use client";

import { useState, useRef, useEffect } from "react";
import { PageHeader, Card, Badge } from "@/components/ui";

interface Msg {
  role: "user" | "assistant" | "system";
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [meta, setMeta] = useState<{ provider: string; routed_model: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "auto", messages: next }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error?.message ?? `HTTP ${res.status}`);
        return;
      }
      setMeta(data.superior_meta ?? null);
      setMessages([...next, { role: "assistant", content: data.choices?.[0]?.message?.content ?? "" }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <PageHeader title="Chat" subtitle="Routed automatically across configured providers via /api/v1/chat/completions." />

      <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px", display: "flex", flexDirection: "column", gap: 12, maxWidth: 780 }}>
        {messages.length === 0 && (
          <Card>
            <span style={{ fontSize: 13, color: "var(--text-mid)" }}>
              No provider API keys are required to see this page work — but a message will fail unless at least one of
              OPENAI_API_KEY, ANTHROPIC_API_KEY, XAI_API_KEY, GOOGLE_AI_API_KEY, or LOCAL_INFERENCE_URL is configured.
            </span>
          </Card>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "80%",
              background: m.role === "user" ? "var(--ink-800)" : "var(--ink-900)",
              border: "1px solid var(--ink-700)",
              borderRadius: 10,
              padding: "10px 13px",
              fontSize: 14,
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
            }}
          >
            {m.content}
          </div>
        ))}
        {error && (
          <Card style={{ borderColor: "var(--err)", alignSelf: "flex-start" }}>
            <span style={{ color: "var(--err)", fontSize: 13 }}>{error}</span>
          </Card>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ borderTop: "1px solid var(--ink-700)", padding: "14px 32px" }}>
        {meta && (
          <div style={{ marginBottom: 8 }}>
            <Badge tone="signal">{meta.routed_model}</Badge>{" "}
            <span style={{ fontSize: 11.5, color: "var(--text-low)" }}>via {meta.provider}</span>
          </div>
        )}
        <div style={{ display: "flex", gap: 8, maxWidth: 780 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
            placeholder="Message SUPERIOR AI…"
            style={{
              flex: 1,
              background: "var(--ink-900)",
              border: "1px solid var(--ink-700)",
              borderRadius: 8,
              padding: "10px 12px",
              color: "var(--text-hi)",
              fontSize: 14,
            }}
          />
          <button
            onClick={send}
            disabled={sending || !input.trim()}
            style={{
              background: "var(--signal)",
              color: "var(--ink-950)",
              border: "none",
              borderRadius: 8,
              padding: "0 18px",
              fontWeight: 600,
              fontSize: 13,
              cursor: sending ? "default" : "pointer",
              opacity: sending || !input.trim() ? 0.6 : 1,
            }}
          >
            {sending ? "…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
