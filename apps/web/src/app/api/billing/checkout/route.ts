import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession } from "@superior-ai/billing";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const result = await createCheckoutSession({
      customerId: body.customerId,
      customerEmail: body.email,
      priceId: body.priceId || process.env.STRIPE_PRICE_ID || "",
      successUrl: body.successUrl || `${appUrl}/settings/billing?checkout=success`,
      cancelUrl: body.cancelUrl || `${appUrl}/settings/billing?checkout=cancel`,
      organizationId: body.organizationId,
      mode: body.mode ?? "subscription",
    });
    if (result.error) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
