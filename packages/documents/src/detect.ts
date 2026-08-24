import type { DocumentKind } from "./types";

export function detectKind(filename?: string, mime?: string, sample?: Buffer | string): DocumentKind {
  const name = (filename ?? "").toLowerCase();
  const m = (mime ?? "").toLowerCase();
  if (name.endsWith(".pdf") || m.includes("pdf")) return "pdf";
  if (name.endsWith(".docx") || m.includes("wordprocessingml")) return "docx";
  if (name.endsWith(".xlsx") || m.includes("spreadsheetml")) return "xlsx";
  if (name.endsWith(".pptx") || m.includes("presentationml")) return "pptx";
  if (name.endsWith(".csv") || m.includes("text/csv")) return "csv";
  if (name.endsWith(".json") || m.includes("json")) return "json";
  if (name.endsWith(".md") || name.endsWith(".markdown")) return "md";
  if (name.endsWith(".html") || name.endsWith(".htm") || m.includes("text/html")) return "html";
  if (/\.(png|jpe?g|gif|webp|bmp|tiff?)$/i.test(name) || m.startsWith("image/")) return "image";
  if (/\.(mp3|wav|m4a|ogg|flac)$/i.test(name) || m.startsWith("audio/")) return "audio";
  if (/\.(mp4|webm|mov|mkv)$/i.test(name) || m.startsWith("video/")) return "video";
  if (name.endsWith(".txt") || m.startsWith("text/")) return "txt";

  if (sample) {
    const buf = typeof sample === "string" ? Buffer.from(sample.slice(0, 16)) : sample.subarray(0, 16);
    if (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) return "pdf"; // %PDF
    if (buf[0] === 0x50 && buf[1] === 0x4b) return "docx"; // ZIP container — may be docx/xlsx/pptx
  }
  return "unknown";
}
