/**
 * Start background worker handlers (orchestrate_async, etc.)
 * Usage: node scripts/worker.mjs
 * In production, run as a separate process/service.
 */
console.log("SUPERIOR AI worker");
console.log("Register handlers via @superior-ai/queue startWorker() from a TS runner:");
console.log("  npx tsx packages/queue/src/worker.ts");
console.log("Or POST /api/queue which auto-starts in-process handlers for dev.");
