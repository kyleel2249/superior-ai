import { NextRequest, NextResponse } from "next/server";
import { parseWebhookEvent, handleWebhookEvent, isStripeConfigured } from "@superior-ai/billing";

/**
 * Stripe webhook endpoint
 * Configure portal endpoint: POST /api/billing/webhook
 * Verify signature in production with STRIPE_WEBHOOK_SECRET.
 */
export async function POST(req: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const raw = await req.text();
  const sig = req.headers.get("stripe-signature");

  // Production: use stripe.webhooks.constructEvent(raw, sig, webhookSecret)
  if (process.env.STRIPE_WEBHOOK_SECRET && !sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const event = parseWebhookEvent(raw);
  if (!event) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const result = handleWebhookEvent(event);
  console.log("[stripe webhook]", event.type, result.action ?? "ignored");

  return NextResponse.json({ received: true, ...result });
}
