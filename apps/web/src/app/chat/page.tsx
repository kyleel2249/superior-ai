"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

type Msg = { role: "user" | "assistant" | "system"; content: string; meta?: string };

const INTELLIGENCE_LEVELS = ["FAST", "BALANCED", "DEEP", "EXPERT", "MAXIMUM", "AUTONOMOUS"] as const;

export default function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "SUPERIOR AI online. Continuous AI capacity is active.\n\nI coordinate an AI Council of specialists and route across available providers. Configure API keys in Admin → Providers to activate models.\n\nHow can the team help you?",
      meta: "Executive Agent",
    },
  ]);
  const [input, setInput] = useState("");
  const [level, setLevel] = useState<(typeof INTELLIGENCE_LEVELS)[number]>("BALANCED");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", content: userMsg }]);
    setLoading(true);
    setStatus("Planning…");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, intelligenceLevel: level }),
      });
      const data = await res.json();
      setStatus(null);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: data.reply ?? data.error ?? "No response",
          meta: data.meta ?? "SUPERIOR AI",
        },
      ]);
    } catch (err) {
      setStatus(null);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: `Error: ${err instanceof Error ? err.message : String(err)}`,
          meta: "System",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-screen flex flex-col bg-[var(--background)]">
      <header className="border-b border-[var(--card-border)] bg-[var(--card)] px-4 h-14 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-zinc-400 hover:text-white text-sm">
            ← Home
          </Link>
          <span className="font-semibold">Command Center</span>
          {status && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 animate-pulse">
              {status}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs text-zinc-500">Intelligence</label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as typeof level)}
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-sm"
          >
            {INTELLIGENCE_LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <Link href="/admin/providers" className="text-xs text-indigo-400 hover:underline">
            Providers
          </Link>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-4xl mx-auto w-full">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                m.role === "user"
                  ? "bg-indigo-600 text-white"
                  : "bg-[var(--card)] border border-[var(--card-border)]"
              }`}
            >
              {m.meta && m.role === "assistant" && (
                <div className="text-[10px] uppercase tracking-wider text-indigo-400 mb-1">{m.meta}</div>
              )}
              <div className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-[var(--card-border)] bg-[var(--card)] p-4">
        <div className="max-w-4xl mx-auto flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Ask the AI Council… (e.g. Build a complete e-commerce platform for my business)"
            rows={2}
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 font-medium transition self-end h-12"
          >
            {loading ? "…" : "Send"}
          </button>
        </div>
        <p className="text-center text-[10px] text-zinc-600 mt-2">
          Continuous AI capacity active · No artificial internal message limits · External provider constraints handled via routing & failover
        </p>
      </div>
    </div>
  );
}
