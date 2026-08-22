export async function runJobHandler(name: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
  switch (name) {
    case "echo":
      return { echoed: true, at: new Date().toISOString(), data };
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
      return { result: await runSafeUrlAudit(String(data.url ?? "")) };
    }
    case "embed_index": {
      const { indexDocuments } = await import("@superior-ai/memory");
      const docs = (data.documents as Array<{ title: string; content: string; source?: string }>) ?? [];
      return { indexed: await indexDocuments(docs) };
    }
    default:
      throw new Error(`Unknown job type: ${name}`);
  }
}
