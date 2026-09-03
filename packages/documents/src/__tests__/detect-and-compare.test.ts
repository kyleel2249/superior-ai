import { describe, it, expect } from "vitest";
import { detectKind } from "../detect";
import { compareDocuments } from "../compare";

describe("detectKind", () => {
  it("detects by file extension when present", () => {
    expect(detectKind("report.pdf")).toBe("pdf");
    expect(detectKind("notes.md")).toBe("md");
    expect(detectKind("data.CSV")).toBe("csv"); // case-insensitive
  });

  it("detects by MIME type when the extension is missing or ambiguous", () => {
    expect(detectKind(undefined, "application/pdf")).toBe("pdf");
    expect(detectKind("upload", "image/png")).toBe("image");
    expect(detectKind("clip", "video/mp4")).toBe("video");
  });

  it("extension takes priority when both name and mime are given but disagree", () => {
    expect(detectKind("report.pdf", "text/plain")).toBe("pdf");
  });

  it("falls back to magic-byte sniffing when there's no usable name or mime", () => {
    const pdfHeader = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]); // %PDF-1.4
    expect(detectKind(undefined, undefined, pdfHeader)).toBe("pdf");

    const zipHeader = Buffer.from([0x50, 0x4b, 0x03, 0x04]); // PK.. (docx/xlsx/pptx are zip containers)
    expect(detectKind(undefined, undefined, zipHeader)).toBe("docx");
  });

  it("returns 'unknown' when nothing matches, rather than guessing", () => {
    expect(detectKind("mystery.xyz")).toBe("unknown");
    expect(detectKind()).toBe("unknown");
  });
});

describe("compareDocuments", () => {
  it("finds terms shared across every document, not just any two", () => {
    const result = compareDocuments([
      { content: "The invoice covers software licensing for the quarter." },
      { content: "This software licensing agreement covers annual renewal." },
      { content: "Software licensing terms are covered under section four." },
    ]);
    expect(result.sharedTerms).toEqual(expect.arrayContaining(["software", "licensing"]));
    expect(result.sharedTerms).not.toContain("invoice"); // only in doc 1
    // No stemming: "covers" (doc 1/2) vs "covered" (doc 3) are different
    // tokens, so neither is shared — documents current exact-match behavior.
    expect(result.sharedTerms).not.toContain("covers");
  });

  it("uniqueByDoc only includes terms absent from every other document", () => {
    const result = compareDocuments([
      { content: "alpha bravo charlie", filename: "a.txt" },
      { content: "bravo charlie delta", filename: "b.txt" },
    ]);
    expect(result.uniqueByDoc["a.txt"]).toContain("alpha");
    expect(result.uniqueByDoc["a.txt"]).not.toContain("bravo");
    expect(result.uniqueByDoc["b.txt"]).toContain("delta");
  });

  it("reports accurate per-document metadata (kind, char count)", () => {
    const result = compareDocuments([{ content: "hello world", filename: "x.txt" }]);
    expect(result.documents[0]?.chars).toBe(11);
    expect(result.documents[0]?.kind).toBe("txt");
  });

  it("sharedTerms is empty for a single document (nothing to share against)", () => {
    const result = compareDocuments([{ content: "just one document here" }]);
    expect(result.sharedTerms).toEqual([]);
  });
});
