/**
 * SUPERIOR AI's memory is conceptually layered — short-lived conversation
 * context, durable structured facts (see persistent.ts), and a searchable
 * knowledge/document layer (see rag.ts). This type just names the layers
 * so callers can tag which one a piece of content belongs to.
 */
export type MemoryLayer = "conversation" | "durable" | "knowledge";

export const MEMORY_LAYERS: MemoryLayer[] = ["conversation", "durable", "knowledge"];
