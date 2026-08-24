export type DocumentKind =
  | "txt"
  | "md"
  | "csv"
  | "json"
  | "html"
  | "pdf"
  | "docx"
  | "xlsx"
  | "pptx"
  | "image"
  | "audio"
  | "video"
  | "unknown";

export interface ExtractedTable {
  headers: string[];
  rows: string[][];
  confidence: number;
}

export interface DocumentParseResult {
  kind: DocumentKind;
  filename?: string;
  text: string;
  tables: ExtractedTable[];
  metadata: Record<string, unknown>;
  confidence: number;
  warnings: string[];
  method: string;
}

export interface MultimodalAnalysisResult {
  kind: DocumentKind;
  summary: string;
  textDetected?: string;
  labels?: string[];
  durationSec?: number;
  transcript?: string;
  speakers?: string[];
  confidence: number;
  providerStatus: "local" | "ADAPTER" | "CONFIGURATION_REQUIRED";
  warnings: string[];
}
