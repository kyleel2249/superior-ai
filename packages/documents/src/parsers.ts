/**
 * Local document parsers — no fabricated content.
 * Complex formats extract best-effort text; adapters marked when external OCR/ASR needed.
 */

import { detectKind } from "./detect";
import type { DocumentKind, DocumentParseResult, ExtractedTable } from "./types";

function base(
  kind: DocumentKind,
  text: string,
  extra: Partial<DocumentParseResult> = {}
): DocumentParseResult {
  return {
    kind,
    text: text.trim(),
    tables: extra.tables ?? [],
    metadata: extra.metadata ?? {},
    confidence: extra.confidence ?? (text.trim() ? 0.85 : 0.2),
    warnings: extra.warnings ?? [],
    method: extra.method ?? "local",
    filename: extra.filename,
  };
}

export function parseTxt(content: string, filename?: string): DocumentParseResult {
  return base("txt", content, { filename, method: "utf8", confidence: 0.99 });
}

export function parseMarkdown(content: string, filename?: string): DocumentParseResult {
  return base("md", content, { filename, method: "markdown", confidence: 0.95 });
}

export function parseHtml(content: string, filename?: string): DocumentParseResult {
  const text = content
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");
  return base("html", text, { filename, method: "html_strip", confidence: 0.8 });
}

export function parseJson(content: string, filename?: string): DocumentParseResult {
  try {
    const obj = JSON.parse(content);
    const text = JSON.stringify(obj, null, 2);
    return base("json", text, {
      filename,
      method: "json_parse",
      confidence: 0.99,
      metadata: { keys: Object.keys(obj).slice(0, 50) },
    });
  } catch (err) {
    return base("json", content, {
      filename,
      confidence: 0.3,
      warnings: [`JSON parse failed: ${err instanceof Error ? err.message : String(err)}`],
    });
  }
}

export function parseCsv(content: string, filename?: string): DocumentParseResult {
  const lines = content.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) {
    return base("csv", "", { filename, confidence: 0.1, warnings: ["Empty CSV"] });
  }
  const split = (line: string) => {
    // simple CSV split — handles quoted fields lightly
    const cols: string[] = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]!;
      if (ch === '"') {
        inQ = !inQ;
        continue;
      }
      if (ch === "," && !inQ) {
        cols.push(cur.trim());
        cur = "";
        continue;
      }
      cur += ch;
    }
    cols.push(cur.trim());
    return cols;
  };
  const headers = split(lines[0]!);
  const rows = lines.slice(1, 501).map(split);
  const table: ExtractedTable = { headers, rows, confidence: 0.9 };
  const text = [headers.join(" | "), ...rows.map((r) => r.join(" | "))].join("\n");
  return base("csv", text, {
    filename,
    tables: [table],
    method: "csv_parse",
    confidence: 0.92,
    metadata: { rowCount: rows.length, columnCount: headers.length },
  });
}

/** Best-effort PDF text: extract readable ASCII/UTF-8 streams (not full PDF engine). */
export function parsePdfBuffer(buf: Buffer, filename?: string): DocumentParseResult {
  const raw = buf.toString("latin1");
  if (!raw.startsWith("%PDF")) {
    return base("pdf", "", {
      filename,
      confidence: 0,
      warnings: ["Not a PDF header"],
      method: "pdf_heuristic",
    });
  }
  // Extract text between parentheses in content streams (naive)
  const chunks: string[] = [];
  const re = /\((?:\\.|[^\\)]){2,500}\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    let s = m[0].slice(1, -1);
    s = s
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "")
      .replace(/\\t/g, "\t")
      .replace(/\\\(/g, "(")
      .replace(/\\\)/g, ")")
      .replace(/\\\\/g, "\\");
    if (/[A-Za-z]{2,}/.test(s)) chunks.push(s);
  }
  // Also try Tj operators with hex strings skipped
  const text = chunks.join(" ").replace(/\s+/g, " ").trim();
  const warnings: string[] = [];
  if (text.length < 40) {
    warnings.push(
      "Low text yield — likely scanned PDF. Use OCR adapter (CONFIGURATION_REQUIRED without OCR provider)."
    );
  }
  return base("pdf", text, {
    filename,
    method: "pdf_heuristic",
    confidence: text.length > 100 ? 0.55 : 0.25,
    warnings,
    metadata: { bytes: buf.length, extractedChunks: chunks.length },
  });
}

/** DOCX is a ZIP of XML — extract word/document.xml text if zlib available via manual unzip is heavy; use XML tags if plain. */
export function parseDocxBuffer(buf: Buffer, filename?: string): DocumentParseResult {
  // Without unzip dependency: search for <w:t> text runs in raw (works for many simple docs)
  const raw = buf.toString("utf8");
  const texts: string[] = [];
  const re = /<w:t[^>]*>([^<]*)<\/w:t>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    if (m[1]) texts.push(m[1]);
  }
  const text = texts.join(" ").replace(/\s+/g, " ").trim();
  const warnings: string[] = [];
  if (!text) {
    warnings.push(
      "Could not extract DOCX text without full ZIP parser. Install/upload as plain text or configure document service."
    );
  }
  return base("docx", text, {
    filename,
    method: "docx_xml_scan",
    confidence: text ? 0.7 : 0.15,
    warnings,
    metadata: { bytes: buf.length },
  });
}

export function parseXlsxBuffer(buf: Buffer, filename?: string): DocumentParseResult {
  const raw = buf.toString("utf8");
  const shared: string[] = [];
  const re = /<t[^>]*>([^<]*)<\/t>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    if (m[1]) shared.push(m[1]);
  }
  const text = shared.join(" | ");
  return base("xlsx", text, {
    filename,
    method: "xlsx_shared_strings_scan",
    confidence: text ? 0.6 : 0.15,
    warnings: text
      ? []
      : ["XLSX extraction limited without full OOXML parser — shared strings scan only."],
    metadata: { sharedStringCount: shared.length },
  });
}

export function parsePptxBuffer(buf: Buffer, filename?: string): DocumentParseResult {
  const raw = buf.toString("utf8");
  const texts: string[] = [];
  const re = /<a:t[^>]*>([^<]*)<\/a:t>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    if (m[1]) texts.push(m[1]);
  }
  const text = texts.join(" ").replace(/\s+/g, " ").trim();
  return base("pptx", text, {
    filename,
    method: "pptx_xml_scan",
    confidence: text ? 0.65 : 0.15,
    warnings: text ? [] : ["PPTX text extraction limited without full ZIP parser."],
  });
}

export function parseDocument(input: {
  content?: string;
  buffer?: Buffer;
  filename?: string;
  mime?: string;
}): DocumentParseResult {
  const kind = detectKind(input.filename, input.mime, input.buffer ?? input.content);
  const filename = input.filename;

  if (kind === "txt" || kind === "md" || kind === "unknown") {
    const content = input.content ?? input.buffer?.toString("utf8") ?? "";
    if (kind === "md") return parseMarkdown(content, filename);
    return parseTxt(content, filename);
  }
  if (kind === "csv") return parseCsv(input.content ?? input.buffer?.toString("utf8") ?? "", filename);
  if (kind === "json") return parseJson(input.content ?? input.buffer?.toString("utf8") ?? "", filename);
  if (kind === "html") return parseHtml(input.content ?? input.buffer?.toString("utf8") ?? "", filename);

  const buf = input.buffer ?? Buffer.from(input.content ?? "", "utf8");
  if (kind === "pdf") return parsePdfBuffer(buf, filename);
  if (kind === "docx") return parseDocxBuffer(buf, filename);
  if (kind === "xlsx") return parseXlsxBuffer(buf, filename);
  if (kind === "pptx") return parsePptxBuffer(buf, filename);

  if (kind === "image" || kind === "audio" || kind === "video") {
    return base(kind, "", {
      filename,
      confidence: 0,
      method: "multimodal_required",
      warnings: [`Use analyzeMultimodal for ${kind} — not plain text parse.`],
    });
  }

  return base("unknown", input.content ?? "", { filename, confidence: 0.2 });
}
