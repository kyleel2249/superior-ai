import { ingestDocument, type DocumentChunk } from "./rag";
import { embedText } from "./embeddings";

export interface IndexDocumentInput {
  title: string;
  content: string;
  source?: string;
}

export interface IndexedDocumentResult {
  title: string;
  chunkIds: string[];
  embedded: number;
}

/**
 * Ingests each document into the lexical chunk store (./rag.ts) and — when
 * OPENAI_API_KEY is configured — also embeds each chunk. Embedding failures
 * per-chunk don't fail the whole batch; they're just not embedded.
 *
 * NOTE: embeddings are computed here but not yet stored against the chunk or
 * used by retrieve() — retrieve() is lexical-only today (see ./rag.ts). This
 * counts how many chunks *could* be embedded; wiring vector storage/search
 * into retrieve() is follow-up work, not done here.
 */
export async function indexDocuments(docs: IndexDocumentInput[]): Promise<IndexedDocumentResult[]> {
  const results: IndexedDocumentResult[] = [];
  for (const doc of docs) {
    const chunks: DocumentChunk[] = ingestDocument({ title: doc.title, content: doc.content, source: doc.source });
    let embedded = 0;
    for (const chunk of chunks) {
      const emb = await embedText(chunk.content);
      if (emb) embedded += 1;
    }
    results.push({ title: doc.title, chunkIds: chunks.map((c) => c.id), embedded });
  }
  return results;
}
