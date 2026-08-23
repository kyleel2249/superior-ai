"use client";

import { useState } from "react";

interface ChatTurn {
  role: "user" | "assistant" | "system";
  content: string;
}

export default function Home() {
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    const message = input.trim();
    if (!message || loading) return;
    setInput("");
    setError(null);
    setTurns((t) => [...t, { role: "user", content: message }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      if (data.reply) {
        setTurns((t) => [...t, { role: "assistant", content: data.reply }]);
      } else {
        setTurns((t) => [
          ...t,
          { role: "system", content: data.note ?? "No reply — check /api/health for provider status." },
        ]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 16px", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>SUPERIOR AI</h1>
        <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 0" }}>
          Every reply is routed through OpenRouter. Set <code>OPENROUTER_API_KEY</code> to enable live model calls —
          check <a href="/api/health">/api/health</a> for current status.
        </p>
      </header>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
        {turns.map((t, i) => (
          <div
            key={i}
            style={{
              alignSelf: t.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "85%",
              background: t.role === "user" ? "#1e1b4b" : t.role === "system" ? "#1c1917" : "#111827",
              border: `1px solid ${t.role === "system" ? "#57534e" : "#1f2937"}`,
              borderRadius: 10,
              padding: "8px 12px",
              fontSize: 14,
              whiteSpace: "pre-wrap",
            }}
          >
            {t.content}
          </div>
        ))}
        {loading && <div style={{ color: "#64748b", fontSize: 13 }}>Thinking…</div>}
        {error && <div style={{ color: "#f87171", fontSize: 13 }}>Error: {error}</div>}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
        style={{ display: "flex", gap: 8 }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask SUPERIOR AI something…"
          style={{
            flex: 1,
            background: "#111827",
            border: "1px solid #1f2937",
            borderRadius: 8,
            padding: "10px 12px",
            color: "#e2e8f0",
            fontSize: 14,
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            background: "#6366f1",
            border: "none",
            borderRadius: 8,
            padding: "10px 16px",
            color: "white",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Send
        </button>
      </form>
    </main>
  );
}
