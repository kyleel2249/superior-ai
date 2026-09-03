/**
 * Shared job handlers for memory queue and BullMQ worker
 */

export async function runJobHandler(
  name: string,
  data: Record<string, unknown>
): Promise<Record<string, unknown>> {
  switch (name) {
    case "echo":
      // Snapshot the payload rather than holding a live reference to it.
      // The caller (memory-queue's echo handler) writes this return value
      // onto job.payload.result — so a live `data` reference here makes
      // job.payload.result.data === job.payload, a direct self-reference
      // that breaks JSON.stringify on every subsequent read of the job
      // (verified: this was actually throwing "Converting circular
      // structure to JSON" on GET /api/queue after any echo job ran).
      return { echoed: true, at: new Date().toISOString(), data: { ...data } };

    case "orchestrate_async": {
      const { runOrchestrator } = await import("@superior-ai/agents");
      const result = await runOrchestrator({
        objective: String(data.objective ?? ""),
        product: data.product as string | undefined,
        audience: data.audience as string | undefined,
        region: data.region as string | undefined,
        competitorUrls: data.competitorUrls as string[] | undefined,
        userId: data.userId as string | undefined,
        projectId: data.projectId as string | undefined,
        mode: (data.mode as "execute_safe") ?? "execute_safe",
      });
      return { result };
    }

    case "url_audit_async": {
      const { runSafeUrlAudit } = await import("@superior-ai/agents");
      const result = await runSafeUrlAudit(String(data.url ?? ""));
      return { result };
    }

    case "embed_index": {
      const { indexDocuments } = await import("@superior-ai/memory");
      const docs = (data.documents as Array<{ title: string; content: string; source?: string }>) ?? [];
      const indexed = await indexDocuments(docs);
      return { indexed };
    }

    default:
      throw new Error(`Unknown job type: ${name}`);
  }
}
