import { describe, it, expect } from "vitest";
import { ingestDocument, retrieve, buildRagContext } from "../lexical-rag";

describe("ingestDocument / chunking", () => {
  it("keeps short documents as a single chunk", () => {
    const chunks = ingestDocument({ title: `Short-${Math.random()}`, content: "Just one short paragraph." });
    expect(chunks).toHaveLength(1);
    expect(chunks[0]?.chunkIndex).toBe(0);
  });

  it("splits long content across paragraph boundaries once past the 800-char target", () => {
    const para = "Lorem ipsum dolor sit amet consectetur adipiscing elit. ".repeat(10); // ~580 chars
    const content = [para, para, para].join("\n\n"); // ~1740 chars across 3 paragraphs
    const chunks = ingestDocument({ title: `Long-${Math.random()}`, content });
    expect(chunks.length).toBeGreaterThan(1);
    // Every chunk keeps whole paragraphs together — never splits mid-paragraph
    for (const c of chunks) {
      expect(content).toContain(c.content);
    }
  });

  it("assigns sequential chunkIndex and a stable documentTitle/source across all chunks", () => {
    const para = "word ".repeat(200);
    const content = [para, para].join("\n\n");
    const chunks = ingestDocument({ title: "Doc X", content, source: "manual-upload" });
    chunks.forEach((c, i) => {
      expect(c.chunkIndex).toBe(i);
      expect(c.documentTitle).toBe("Doc X");
      expect(c.source).toBe("manual-upload");
    });
  });
});

describe("retrieve", () => {
  it("ranks chunks by keyword overlap with the query, best match first", () => {
    const marker = `uniqueterm${Math.random().toString(36).slice(2, 8)}`;
    ingestDocument({ title: "Irrelevant", content: "This document is about gardening and plants." });
    ingestDocument({ title: "Relevant", content: `This document is entirely about ${marker} and how it works in production systems.` });

    const results = retrieve(marker, 5);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.documentTitle).toBe("Relevant");
  });

  it("returns nothing for a query with no lexical overlap in the corpus", () => {
    const nonsense = `zzzznomatch${Math.random().toString(36).slice(2, 10)}`;
    const results = retrieve(nonsense, 5);
    expect(results).toHaveLength(0);
  });

  it("respects the limit parameter", () => {
    const marker = `limittest${Math.random().toString(36).slice(2, 8)}`;
    for (let i = 0; i < 5; i++) {
      ingestDocument({ title: `Doc ${i}`, content: `Talking about ${marker} in document number ${i}.` });
    }
    expect(retrieve(marker, 2)).toHaveLength(2);
    expect(retrieve(marker, 10).length).toBeGreaterThanOrEqual(5);
  });
});

describe("buildRagContext", () => {
  it("returns an empty string when nothing matches, rather than fabricating context", () => {
    const nonsense = `nocontext${Math.random().toString(36).slice(2, 10)}`;
    expect(buildRagContext(nonsense)).toBe("");
  });

  it("formats matched chunks with title, source, and chunk index headers", () => {
    const marker = `ctxmarker${Math.random().toString(36).slice(2, 8)}`;
    ingestDocument({ title: "Runbook", content: `Steps for handling ${marker} incidents.`, source: "wiki" });
    const context = buildRagContext(marker);
    expect(context).toContain("## Runbook (wiki)");
    expect(context).toContain(marker);
  });
});
