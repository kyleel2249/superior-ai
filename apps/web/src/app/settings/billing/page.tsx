"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function BillingSettingsPage() {
  const [status, setStatus] = useState<Record<string, unknown> | null>(null);
  const [email, setEmail] = useState("billing@example.com");
  const [customerId, setCustomerId] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/billing?organizationId=org_dev")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus({ error: "failed to load" }));
  }, []);

  async function startCheckout() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, organizationId: "org_dev" }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setMsg(data.error || "Checkout unavailable — set STRIPE_SECRET_KEY and STRIPE_PRICE_ID");
    } finally {
      setLoading(false);
    }
  }

  async function openPortal() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setMsg(data.error || "Portal requires Stripe customerId");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-white">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-sm text-zinc-400 hover:text-white">
          SUPERIOR AI
        </Link>
        <span className="text-zinc-600">/</span>
        <h1 className="font-medium">Billing</h1>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-8">
        <section className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--card-border)] space-y-3">
          <h2 className="font-medium">Usage & budget</h2>
          <pre className="text-xs text-zinc-400 overflow-auto max-h-48">
            {JSON.stringify(status, null, 2)}
          </pre>
        </section>

        <section className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--card-border)] space-y-4">
          <h2 className="font-medium">Stripe Checkout</h2>
          <p className="text-sm text-zinc-400">
            Opens official Stripe Checkout when <code className="text-zinc-300">STRIPE_SECRET_KEY</code> and{" "}
            <code className="text-zinc-300">STRIPE_PRICE_ID</code> are set.
          </p>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-sm"
            placeholder="Billing email"
          />
          <button
            onClick={startCheckout}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-medium disabled:opacity-40"
          >
            Subscribe
          </button>
        </section>

        <section className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--card-border)] space-y-4">
          <h2 className="font-medium">Customer Portal</h2>
          <input
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-sm"
            placeholder="cus_..."
          />
          <button
            onClick={openPortal}
            disabled={loading || !customerId}
            className="px-4 py-2 rounded-xl border border-zinc-600 hover:border-zinc-400 text-sm disabled:opacity-40"
          >
            Open portal
          </button>
        </section>

        {msg && <p className="text-sm text-amber-400">{msg}</p>}
      </main>
    </div>
  );
}
