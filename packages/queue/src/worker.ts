/**
 * Standalone worker entrypoint (`npm run worker`). The in-process queue
 * (memory-queue.ts) already processes jobs immediately on enqueue within
 * the Next.js process — this script exists for the case where you want a
 * separate long-running process instead (e.g. so job processing survives
 * web-server restarts/redeploys). It just keeps the process alive; jobs
 * enqueued via @superior-ai/queue from *this* process would be processed
 * here. Swap memory-queue.ts for a real broker (BullMQ/SQS) to make jobs
 * enqueued from the web process actually reach this worker process.
 */
console.log("[worker] SUPERIOR AI queue worker started (in-memory queue, single-process only).");
setInterval(() => {}, 1 << 30);
