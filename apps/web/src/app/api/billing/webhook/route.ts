import { NextRequest, NextResponse } from "next/server";
import { parseWebhookEvent, handleWebhookEvent, isStripeConfigured } from "@superior-ai/billing";

export async function POST(req: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }
  const raw = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (process.env.STRIPE_WEBHOOK_SECRET && !sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }
  const event = parseWebhookEvent(raw);
  if (!event) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  const result = handleWebhookEvent(event);
  return NextResponse.json({ received: true, ...result });
}
