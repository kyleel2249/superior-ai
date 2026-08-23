import { NextRequest, NextResponse } from "next/server";
import {
  enqueue,
  getJob,
  listJobs,
  getQueueStats,
  initQueue,
  getQueueBackend,
  enqueueOrchestration,
  startWorker,
} from "@superior-ai/queue";

let workerStarted = false;

async function ensureWorker() {
  if (!workerStarted) {
    await startWorker();
    workerStarted = true;
  }
}

export async function GET(req: NextRequest) {
  await ensureWorker();
  await initQueue();
  const id = req.nextUrl.searchParams.get("id");
  if (id) {
    const job = getJob(id);
    if (!job) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(job);
  }
  return NextResponse.json({
    backend: getQueueBackend(),
    stats: getQueueStats(),
    jobs: listJobs().slice(0, 50),
  });
}

export async function POST(req: NextRequest) {
  await ensureWorker();
  const body = await req.json();
  if (body.type === "orchestrate_async" || body.action === "orchestrate") {
    const job = enqueueOrchestration(body.payload ?? body);
    return NextResponse.json(job, { status: 201 });
  }
  const job = enqueue({
    type: body.type ?? "echo",
    payload: body.payload ?? {},
    lane: body.lane ?? "background",
    priority: body.priority ?? 50,
  });
  return NextResponse.json(job, { status: 201 });
}
