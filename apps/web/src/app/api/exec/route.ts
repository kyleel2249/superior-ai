import { NextRequest, NextResponse } from "next/server";
import { executeCode, type ExecLanguage } from "@superior-ai/tools";
import { audit } from "@superior-ai/audit";
import { limitApi } from "@superior-ai/observability";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "anon";
  const rl = limitApi(ip);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded", retryAfterSec: rl.retryAfterSec }, { status: 429 });
  }
  try {
    const body = await req.json();
    const result = await executeCode({
      language: (body.language ?? "javascript") as ExecLanguage,
      code: String(body.code ?? ""),
      timeoutMs: body.timeoutMs,
      execute: body.execute === true,
    });
    audit({
      action: "tool.execute",
      outcome: result.success ? "success" : "failure",
      resourceType: "code_exec",
      meta: { language: result.language, executed: result.executed, error: result.error },
      ip,
    });
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
