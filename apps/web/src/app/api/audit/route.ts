import { NextRequest, NextResponse } from "next/server";
import { runSafeUrlAudit } from "@superior-ai/agents";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url = String(body.url ?? "").trim();
    if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });
    return NextResponse.json(await runSafeUrlAudit(url));
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
