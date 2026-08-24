/**
 * Document & multimodal tools for agent runtime.
 */

import type { ToolDefinition } from "./types";
import { registerTool } from "./registry";

let registered = false;

export function registerDocumentTools(): void {
  if (registered) return;
  registered = true;

  const parseTool: ToolDefinition = {
    name: "document_parse",
    description: "Parse text/CSV/JSON/HTML/PDF/DOCX/XLSX/PPTX content into text and tables.",
    permissions: ["read_files"],
    sensitive: false,
    execute: async (input) => {
      const { parseDocument } = await import("@superior-ai/documents");
      const result = parseDocument({
        content: input.content as string | undefined,
        filename: input.filename as string | undefined,
        mime: input.mime as string | undefined,
      });
      return { success: true, data: result };
    },
  };

  const analyzeTool: ToolDefinition = {
    name: "multimodal_analyze",
    description: "Analyze image/audio/video via provider adapters when configured.",
    permissions: ["read_files"],
    sensitive: false,
    execute: async (input) => {
      const { analyzeMultimodal } = await import("@superior-ai/documents");
      const result = await analyzeMultimodal({
        filename: input.filename as string | undefined,
        mime: input.mime as string | undefined,
        base64: input.base64 as string | undefined,
      });
      return { success: true, data: result };
    },
  };

  registerTool(parseTool);
  registerTool(analyzeTool);
}

registerDocumentTools();
