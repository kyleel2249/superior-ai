export async function createCheckoutSession(input: {
  customerId?: string;
  customerEmail?: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  organizationId?: string;
  mode?: "subscription" | "payment";
}): Promise<{ url?: string; id?: string; error?: string }> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return { error: "STRIPE_SECRET_KEY not configured" };
  const priceId = input.priceId || process.env.STRIPE_PRICE_ID || process.env.STRIPE_METER_PRICE_ID;
  if (!priceId) return { error: "priceId or STRIPE_PRICE_ID required" };
  try {
    const params = new URLSearchParams({
      mode: input.mode ?? "subscription",
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      allow_promotion_codes: "true",
    });
    if (input.customerId) params.set("customer", input.customerId);
    else if (input.customerEmail) params.set("customer_email", input.customerEmail);
    if (input.organizationId) params.set("metadata[organizationId]", input.organizationId);
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });
    if (!res.ok) return { error: `Stripe HTTP ${res.status}` };
    const data = (await res.json()) as { id: string; url?: string };
    return { id: data.id, url: data.url };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function createPortalSession(input: {
  customerId: string;
  returnUrl: string;
}): Promise<{ url?: string; error?: string }> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return { error: "STRIPE_SECRET_KEY not configured" };
  try {
    const params = new URLSearchParams({ customer: input.customerId, return_url: input.returnUrl });
    const res = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });
    if (!res.ok) return { error: `Stripe HTTP ${res.status}` };
    const data = (await res.json()) as { url?: string };
    return { url: data.url };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}
