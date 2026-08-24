import Link from "next/link";

export default function BillingPage() {
  const enabled = process.env.ENABLE_BILLING_UI === "1";

  if (!enabled) {
    return (
      <div className="max-w-lg mx-auto px-6 py-16 space-y-4">
        <h1 className="text-xl font-semibold">Billing</h1>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Default local-first mode does not expose billing, credits, or token meters. Provider
          capacity is handled by routing and failover — you do not manage tokens in the UI.
        </p>
        <Link href="/settings/preferences" className="text-indigo-400 text-sm hover:underline">
          Preferences
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-16 space-y-4">
      <h1 className="text-xl font-semibold">Billing</h1>
      <p className="text-sm text-zinc-400">
        Commercial billing is enabled for this deployment. Use Checkout via the billing API.
      </p>
      <Link href="/api/billing" className="text-indigo-400 text-sm">
        Billing API
      </Link>
    </div>
  );
}
