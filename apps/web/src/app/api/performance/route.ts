import { NextRequest, NextResponse } from "next/server";
import {
  DEFAULT_BUDGETS,
  recordTiming,
  timingSummary,
  scaleChecklist,
  paginate,
  withTimingAsync,
} from "@superior-ai/observability";
import { cacheStats } from "@superior-ai/cache";

export async function GET(req: NextRequest) {
  const view = req.nextUrl.searchParams.get("view");
  if (view === "budgets") return NextResponse.json({ budgets: DEFAULT_BUDGETS });
  if (view === "timings") return NextResponse.json({ summary: timingSummary() });
  if (view === "scale") return NextResponse.json({ checklist: scaleChecklist() });
  if (view === "cache") return NextResponse.json({ cache: cacheStats() });
  return NextResponse.json({
    budgets: DEFAULT_BUDGETS,
    summary: timingSummary(),
    scale: scaleChecklist(),
    cache: cacheStats(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action ?? "record");

    if (action === "record") {
      const sample = recordTiming(String(body.budgetId ?? "api_health"), Number(body.durationMs ?? 0));
      return NextResponse.json(sample);
    }

    if (action === "paginate") {
      const items = Array.isArray(body.items) ? body.items : [];
      return NextResponse.json(paginate(items, Number(body.page ?? 1), Number(body.pageSize ?? 20)));
    }

    if (action === "probe_health") {
      const result = await withTimingAsync("api_health", async () => {
        const t0 = Date.now();
        // lightweight local probe
        return { ok: true, ms: Date.now() - t0 };
      });
      return NextResponse.json({ result, summary: timingSummary("api_health") });
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
