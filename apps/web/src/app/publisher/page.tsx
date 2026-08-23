"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function PublisherPortalPage() {
  const [name, setName] = useState("Demo Publisher");
  const [email, setEmail] = useState("publisher@example.com");
  const [publisherId, setPublisherId] = useState("");
  const [packJson, setPackJson] = useState(
    JSON.stringify(
      {
        id: "pack.partner.demo",
        name: "Partner Demo Pack",
        version: "1.0.0",
        category: "operations",
        description: "Example third-party pack",
        agents: ["Custom Agent"],
        workflows: ["demo_flow"],
        requiredTools: [],
        requiredPermissions: ["read"],
        author: "Demo Publisher",
        verified: false,
        pricing: "add_on",
      },
      null,
      2
    )
  );
  const [result, setResult] = useState<string>("");
  const [balance, setBalance] = useState<Record<string, unknown> | null>(null);

  async function register() {
    const res = await fetch("/api/publishers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "register", name, email, shareBps: 7000 }),
    });
    const data = await res.json();
    setPublisherId(data.id ?? "");
    setResult(JSON.stringify(data, null, 2));
  }

  async function publish() {
    let pack;
    try {
      pack = JSON.parse(packJson);
    } catch {
      setResult("Invalid JSON");
      return;
    }
    const res = await fetch("/api/publishers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "publish_pack",
        pack,
        publisherId: publisherId || undefined,
      }),
    });
    const data = await res.json();
    setResult(JSON.stringify(data, null, 2));
  }

  async function loadBalance() {
    if (!publisherId) return;
    const res = await fetch(`/api/publishers?publisherId=${encodeURIComponent(publisherId)}`);
    setBalance(await res.json());
  }

  async function simulateSale() {
    const res = await fetch("/api/publishers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "record_sale",
        packId: "pack.partner.demo",
        organizationId: "org_dev",
        grossUsd: 49,
      }),
    });
    setResult(JSON.stringify(await res.json(), null, 2));
    await loadBalance();
  }

  useEffect(() => {
    loadBalance().catch(() => undefined);
  }, [publisherId]);

  return (
    <div className="min-h-screen bg-[var(--background)] text-white">
      <header className="border-b border-zinc-800 px-6 py-4 flex gap-4 items-center">
        <Link href="/" className="text-sm text-zinc-400 hover:text-white">
          SUPERIOR AI
        </Link>
        <span className="text-zinc-600">/</span>
        <h1 className="font-medium">Publisher portal</h1>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        <p className="text-sm text-zinc-400">
          Register as a publisher, publish a signed pack manifest, and track revenue share (default
          70% publisher / 30% platform).
        </p>

        <section className="space-y-3 p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40">
          <h2 className="font-medium text-sm">1. Register</h2>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm"
            placeholder="Publisher name"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm"
            placeholder="Email"
          />
          <button
            onClick={register}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm"
          >
            Register publisher
          </button>
          {publisherId && (
            <p className="text-xs text-emerald-400">Publisher ID: {publisherId}</p>
          )}
        </section>

        <section className="space-y-3 p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40">
          <h2 className="font-medium text-sm">2. Publish pack manifest</h2>
          <textarea
            value={packJson}
            onChange={(e) => setPackJson(e.target.value)}
            rows={14}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono"
          />
          <button
            onClick={publish}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm"
          >
            Sign & publish
          </button>
        </section>

        <section className="space-y-3 p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40">
          <h2 className="font-medium text-sm">3. Revenue share</h2>
          <button
            onClick={simulateSale}
            className="px-4 py-2 rounded-xl border border-zinc-600 text-sm hover:border-zinc-400"
          >
            Simulate $49 sale
          </button>
          <button
            onClick={loadBalance}
            className="ml-2 px-4 py-2 rounded-xl border border-zinc-600 text-sm hover:border-zinc-400"
          >
            Refresh balance
          </button>
          {balance && (
            <pre className="text-xs text-zinc-400 overflow-auto max-h-40">
              {JSON.stringify(balance, null, 2)}
            </pre>
          )}
        </section>

        {result && (
          <pre className="text-xs text-zinc-400 p-4 rounded-xl border border-zinc-800 overflow-auto max-h-64">
            {result}
          </pre>
        )}
      </main>
    </div>
  );
}
