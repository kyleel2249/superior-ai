/**
 * Stripe metering + webhooks
 * Official Stripe API only — no fake charges.
 */

export interface StripeConfig {
  secretKey: string;
  webhookSecret?: string;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export async function createCustomer(input: {
  email: string;
  name?: string;
  organizationId?: string;
}): Promise<{ id?: string; error?: string }> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return { error: "STRIPE_SECRET_KEY not configured" };

  try {
    const body = new URLSearchParams({
      email: input.email,
      ...(input.name ? { name: input.name } : {}),
      ...(input.organizationId ? { "metadata[organizationId]": input.organizationId } : {}),
    });
    const res = await fetch("https://api.stripe.com/v1/customers", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    if (!res.ok) {
      return { error: `Stripe HTTP ${res.status}: ${(await res.text()).slice(0, 200)}` };
    }
    const data = (await res.json()) as { id: string };
    return { id: data.id };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

/** Report metered usage to a Stripe subscription item (usage records) */
export async function reportMeteredUsage(input: {
  subscriptionItemId: string;
  quantity: number;
  timestamp?: number;
}): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return { ok: false, error: "STRIPE_SECRET_KEY not configured" };

  try {
    const body = new URLSearchParams({
      quantity: String(Math.ceil(input.quantity)),
      timestamp: String(input.timestamp ?? Math.floor(Date.now() / 1000)),
      action: "increment",
    });
    const res = await fetch(
      `https://api.stripe.com/v1/subscription_items/${input.subscriptionItemId}/usage_records`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      }
    );
    if (!res.ok) {
      return { ok: false, error: `Stripe HTTP ${res.status}: ${(await res.text()).slice(0, 200)}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export interface WebhookEvent {
  type: string;
  id: string;
  data: unknown;
}

/**
 * Parse Stripe webhook body.
 * Production must verify stripe-signature with STRIPE_WEBHOOK_SECRET (constructEvent).
 */
export function parseWebhookEvent(rawBody: string): WebhookEvent | null {
  try {
    const parsed = JSON.parse(rawBody) as { id?: string; type?: string; data?: unknown };
    if (!parsed.type || !parsed.id) return null;
    return { id: parsed.id, type: parsed.type, data: parsed.data };
  } catch {
    return null;
  }
}

export function handleWebhookEvent(event: WebhookEvent): {
  handled: boolean;
  action?: string;
  note?: string;
} {
  switch (event.type) {
    case "invoice.paid":
      return { handled: true, action: "activate_subscription", note: "Mark org plan active" };
    case "invoice.payment_failed":
      return { handled: true, action: "payment_failed", note: "Notify org owner; optional soft lock" };
    case "customer.subscription.deleted":
      return { handled: true, action: "cancel_subscription", note: "Downgrade org to free" };
    case "customer.subscription.updated":
      return { handled: true, action: "sync_subscription", note: "Sync plan limits to BillingBudget" };
    default:
      return { handled: false, note: `Unhandled event type: ${event.type}` };
  }
}
