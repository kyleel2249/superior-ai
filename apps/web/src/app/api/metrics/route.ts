import { NextResponse } from "next/server";
import { getMetricsSnapshot, getRecentSpans } from "@superior-ai/observability";

export async function GET() {
  return NextResponse.json({
    ...getMetricsSnapshot(),
    recentSpans: getRecentSpans(15),
    note: "In-process metrics. Set OTEL_LOG_SPANS=1 for JSON span logs.",
  });
}
