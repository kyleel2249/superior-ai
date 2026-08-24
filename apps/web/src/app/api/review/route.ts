import { NextRequest, NextResponse } from "next/server";
import { reviewCode, reviewBrokenFixture } from "@superior-ai/agents";

export async function GET() {
  return NextResponse.json({
    actions: ["review", "fixture"],
    note: "POST code + optional requirements. Auto-fixes are limited and re-verified by re-scan only.",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action ?? "review");

    if (action === "fixture") {
      return NextResponse.json(reviewBrokenFixture());
    }

    const code = String(body.code ?? "");
    if (!code.trim()) {
      return NextResponse.json({ error: "code required" }, { status: 400 });
    }

    const report = reviewCode({
      code,
      filename: body.filename,
      requirements: Array.isArray(body.requirements) ? body.requirements.map(String) : undefined,
      applyFixes: body.applyFixes === true,
    });

    return NextResponse.json(report);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
