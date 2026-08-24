import { NextRequest, NextResponse } from "next/server";
import {
  parseDocument,
  detectKind,
  analyzeMultimodal,
  compareDocuments,
  multiDocumentAnalysis,
} from "@superior-ai/documents";

export async function GET() {
  return NextResponse.json({
    supported: [
      "txt",
      "md",
      "csv",
      "json",
      "html",
      "pdf",
      "docx",
      "xlsx",
      "pptx",
      "image",
      "audio",
      "video",
    ],
    actions: ["parse", "detect", "analyze", "compare", "multi"],
    note: "OCR/ASR/video understanding require provider keys. Confidence scores are returned honestly.",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action ?? "parse");

    if (action === "detect") {
      return NextResponse.json({
        kind: detectKind(body.filename, body.mime, body.content),
      });
    }

    if (action === "parse") {
      const result = parseDocument({
        content: body.content,
        buffer: body.base64 ? Buffer.from(String(body.base64), "base64") : undefined,
        filename: body.filename,
        mime: body.mime,
      });
      return NextResponse.json(result);
    }

    if (action === "analyze") {
      const result = await analyzeMultimodal({
        filename: body.filename,
        mime: body.mime,
        base64: body.base64,
        content: body.content,
      });
      return NextResponse.json(result);
    }

    if (action === "compare") {
      const docs = Array.isArray(body.documents) ? body.documents : [];
      if (docs.length < 2) {
        return NextResponse.json({ error: "documents array with ≥2 items required" }, { status: 400 });
      }
      return NextResponse.json(compareDocuments(docs));
    }

    if (action === "multi") {
      const docs = Array.isArray(body.documents) ? body.documents : [];
      if (!docs.length) {
        return NextResponse.json({ error: "documents array required" }, { status: 400 });
      }
      return NextResponse.json(multiDocumentAnalysis(docs));
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
