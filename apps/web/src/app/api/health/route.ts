import { NextResponse } from "next/server";
import { checkAllFromEnv, getHealthSnapshot } from "@superior-ai/ai-gateway";

export async function GET() {
  const snapshots = await checkAllFromEnv();
  return NextResponse.json({
    status: "ok",
    continuousCapacity: true,
    message: "Continuous AI capacity is active. External provider limits handled via routing and failover.",
    providers: snapshots,
    cached: getHealthSnapshot(),
  });
}
