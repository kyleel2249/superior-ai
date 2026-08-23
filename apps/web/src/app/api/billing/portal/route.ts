import { NextRequest, NextResponse } from "next/server";
import { createPortalSession } from "@superior-ai/billing";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.customerId) {
      return NextResponse.json({ error: "customerId required" }, { status: 400 });
    }
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const result = await createPortalSession({
      customerId: body.customerId,
      returnUrl: body.returnUrl || `${appUrl}/settings/billing`,
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
