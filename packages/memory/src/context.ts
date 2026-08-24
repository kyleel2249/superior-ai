/**
 * Build memory context block for chat orchestrator — relevance-filtered only.
 */

import { retrieveRelevant, formatMemoryForPrompt, type PersistentMemoryType } from "./persistent";
import { hybridRetrieve } from "./rag";

export async function buildMemoryContext(input: {
  query: string;
  profileId?: string;
  projectId?: string;
  types?: PersistentMemoryType[];
  limit?: number;
}): Promise<{
  promptBlock: string;
  recordCount: number;
  ragHits: number;
  backend: string;
}> {
  const { records } = retrieveRelevant({
    query: input.query,
    types: input.types,
    projectId: input.projectId,
    profileId: input.profileId,
    limit: input.limit ?? 8,
  });

  let ragHits = 0;
  try {
    const rag = await hybridRetrieve(input.query, { limit: 4, minScore: 0.2 });
    ragHits = rag.hits.length;
    // Append high-scoring RAG hits not already in records
    const seen = new Set(records.map((r) => r.content.slice(0, 80)));
    for (const h of rag.hits) {
      if (!seen.has(h.content.slice(0, 80))) {
        records.push({
          id: h.id,
          type: "research",
          content: h.content,
          importance: Math.round(h.score * 100),
          tags: ["rag"],
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }
  } catch {
    /* rag optional */
  }

  return {
    promptBlock: formatMemoryForPrompt(records.slice(0, input.limit ?? 10)),
    recordCount: records.length,
    ragHits,
    backend: "hybrid",
  };
}
