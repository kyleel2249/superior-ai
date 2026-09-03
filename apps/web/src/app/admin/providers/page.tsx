"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ModelRow = {
  id: string;
  provider: string;
  modelId: string;
  displayName: string;
  status: string;
  availability: boolean;
  healthScore: number;
  priority: number;
  aliases?: string[];
};

type HealthRow = {
  provider: string;
  status: string;
  healthScore: number;
  latencyMs?: number;
  message?: string;
  checkedAt: string;
};

type CredentialRow = {
  provider: string;
  configured: boolean;
  source: "env" | "runtime" | "none";
  baseUrl?: string;
  keyFingerprint?: string;
  savedAt?: string;
};

const KEYABLE_PROVIDERS: Array<{ provider: string; label: string; helpUrl?: string }> = [
  { provider: "openai", label: "OpenAI" },
  { provider: "anthropic", label: "Anthropic" },
  { provider: "xai", label: "xAI (Grok)" },
  { provider: "google", label: "Google AI" },
  { provider: "openrouter", label: "OpenRouter" },
  { provider: "azure-openai", label: "Azure OpenAI" },
];

const STATUS_COLOR: Record<string, string> = {
  AVAILABLE: "text-emerald-400",
  REGISTERED: "text-zinc-400",
  CONFIGURATION_REQUIRED: "text-amber-400",
  UNAVAILABLE: "text-zinc-500",
  DEPRECATED: "text-orange-400",
  HEALTH_CHECK_FAILED: "text-red-400",
};

export default function ProvidersAdminPage() {
  const [models, setModels] = useState<ModelRow[]>([]);
  const [health, setHealth] = useState<HealthRow[]>([]);
  const [credentials, setCredentials] = useState<CredentialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [healthMsg, setHealthMsg] = useState("");
  const [keyInputs, setKeyInputs] = useState<Record<string, string>>({});
  const [keyBusy, setKeyBusy] = useState<string | null>(null);
  const [keyMessage, setKeyMessage] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    try {
      const [m, h] = await Promise.all([
        fetch("/api/models").then((r) => r.json()),
        fetch("/api/health").then((r) => r.json()),
      ]);
      setModels(m.models ?? []);
      setCredentials(m.credentials ?? []);
      setHealth(h.providers ?? []);
      setHealthMsg(h.message ?? "");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function saveKey(provider: string) {
    const key = keyInputs[provider]?.trim();
    if (!key) return;
    setKeyBusy(provider);
    setKeyMessage((prev) => ({ ...prev, [provider]: "" }));
    try {
      const res = await fetch("/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_key", provider, key }),
      });
      const json = await res.json();
      const v = json.verification as
        | { ok: boolean; discovered?: string[]; registeredNew?: number; message?: string }
        | { error: string }
        | null;
      const verified = v && "ok" in v && v.ok && Array.isArray(v.discovered) && v.discovered.length > 0;
      const failureText = v && "error" in v ? v.error : v && "message" in v ? v.message : undefined;
      setKeyMessage((prev) => ({
        ...prev,
        [provider]: verified
          ? `Saved and verified — found ${(v as { discovered: string[] }).discovered.length} model(s) live.`
          : failureText
            ? `Saved, but live verification failed: ${failureText}`
            : "Saved.",
      }));
      setKeyInputs((prev) => ({ ...prev, [provider]: "" }));
      await load();
    } catch (e) {
      setKeyMessage((prev) => ({
        ...prev,
        [provider]: e instanceof Error ? e.message : String(e),
      }));
    } finally {
      setKeyBusy(null);
    }
  }

  async function deleteKey(provider: string) {
    setKeyBusy(provider);
    try {
      await fetch("/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_key", provider }),
      });
      setKeyMessage((prev) => ({ ...prev, [provider]: "Removed." }));
      await load();
    } finally {
      setKeyBusy(null);
    }
  }

  const byProvider = models.reduce<Record<string, ModelRow[]>>((acc, m) => {
    (acc[m.provider] ??= []).push(m);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--card-border)] bg-[var(--card)] px-6 h-14 flex items-center gap-4">
        <Link href="/" className="text-zinc-400 hover:text-white text-sm">← Home</Link>
        <h1 className="font-semibold">Admin · Providers & Health</h1>
        <button onClick={load} className="ml-auto text-sm text-indigo-400 hover:underline">Refresh health</button>
        <Link href="/chat" className="text-sm text-indigo-400 hover:underline">Command Center</Link>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-6 p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5 text-sm text-indigo-100/90">
          {healthMsg || "Continuous AI capacity is active."}
        </div>

        <h2 className="text-lg font-semibold mb-1">API Keys</h2>
        <p className="text-xs text-zinc-500 mb-4 max-w-2xl">
          Add a provider key here to enable it without editing environment variables or
          restarting. Keys are encrypted at rest and, when saved, are immediately verified with a
          real live call to that provider — you&apos;ll see exactly whether it worked. A real
          deployment environment variable always takes priority over a key saved here, so this
          can never silently override infra-managed configuration.
        </p>
        <div className="grid md:grid-cols-2 gap-3 mb-10">
          {KEYABLE_PROVIDERS.map((p, i) => {
            const cred = credentials.find((c) => c.provider === p.provider);
            const configured = cred?.configured ?? false;
            const source = cred?.source ?? "none";
            return (
              <div
                key={p.provider}
                className="p-4 card-glow animate-fade-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{p.label}</span>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      color: configured ? "#34d399" : "#71717a",
                      background: configured ? "rgba(52,211,153,0.12)" : "rgba(113,113,122,0.12)",
                    }}
                  >
                    {configured ? (source === "env" ? "SET (env)" : "SET (saved here)") : "NOT SET"}
                  </span>
                </div>
                {configured && cred?.keyFingerprint && (
                  <div className="text-[11px] text-zinc-500 font-mono mb-2">
                    {cred.keyFingerprint}
                    {source === "env" && " — from deployment env, can't be removed here"}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={keyInputs[p.provider] ?? ""}
                    onChange={(e) =>
                      setKeyInputs((prev) => ({ ...prev, [p.provider]: e.target.value }))
                    }
                    placeholder={configured ? "Replace key…" : "Paste API key…"}
                    className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-400/60"
                  />
                  <button
                    onClick={() => saveKey(p.provider)}
                    disabled={keyBusy === p.provider || !keyInputs[p.provider]?.trim()}
                    className="btn-rainbow rounded-lg px-3 py-1.5 text-xs disabled:opacity-50 flex-shrink-0"
                  >
                    {keyBusy === p.provider ? "Saving…" : "Save"}
                  </button>
                  {configured && source === "runtime" && (
                    <button
                      onClick={() => deleteKey(p.provider)}
                      disabled={keyBusy === p.provider}
                      className="chip cursor-pointer border-rose-500/50 text-rose-300 flex-shrink-0 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  )}
                </div>
                {keyMessage[p.provider] && (
                  <div className="text-xs text-zinc-400 mt-2">{keyMessage[p.provider]}</div>
                )}
              </div>
            );
          })}
        </div>

        <h2 className="text-lg font-semibold mb-1">Provider health</h2>
        <p className="text-xs text-zinc-500 mb-3 max-w-2xl">
          Live reachability of each configured provider — health score and latency come from an
          actual request, not a static assumption.
        </p>
        <div className="grid md:grid-cols-3 gap-3 mb-10">
          {loading && !health.length ? (
            <p className="text-zinc-500">Checking…</p>
          ) : (
            health.map((h, i) => (
              <div key={h.provider} className="p-4 card-glow animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="flex justify-between items-center">
                  <span className="font-medium uppercase text-sm">{h.provider}</span>
                  <span className={`text-xs ${STATUS_COLOR[h.status] ?? "text-zinc-400"}`}>{h.status}</span>
                </div>
                <div className="text-xs text-zinc-500 mt-2">
                  Health {h.healthScore}
                  {h.latencyMs != null ? ` · ${h.latencyMs}ms` : ""}
                </div>
                {h.message && <div className="text-xs text-zinc-500 mt-1 truncate">{h.message}</div>}
              </div>
            ))
          )}
        </div>

        <div className="mb-8 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 text-sm text-amber-200/90">
          <strong>Integration rule:</strong> Models are only AVAILABLE after credential + endpoint validation.
          Future names (GPT-6, GPT-7, …) stay UNAVAILABLE until real endpoints exist.
        </div>

        {Object.entries(byProvider).map(([provider, list]) => (
          <section key={provider} className="mb-10">
            <h2 className="text-lg font-semibold capitalize mb-3">{provider} <span className="text-xs font-normal text-zinc-500">{list.length}</span></h2>
            <div className="overflow-x-auto card-glow animate-fade-up">
              <table className="w-full text-sm">
                <thead className="bg-zinc-900/80 text-zinc-400 text-left">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Model ID</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Health</th>
                    <th className="px-4 py-3">Aliases</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((m) => (
                    <tr key={m.id} className="border-t border-[var(--card-border)]">
                      <td className="px-4 py-3 font-medium">{m.displayName}</td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-400">{m.modelId}</td>
                      <td className={`px-4 py-3 ${STATUS_COLOR[m.status] ?? ""}`}>{m.status}</td>
                      <td className="px-4 py-3">{m.healthScore}</td>
                      <td className="px-4 py-3 text-xs text-zinc-500">{(m.aliases ?? []).join(", ") || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
