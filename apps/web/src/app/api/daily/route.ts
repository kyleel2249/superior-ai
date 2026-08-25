import { NextRequest, NextResponse } from "next/server";
import { generateDailyBrief } from "@superior-ai/intelligence";
import { retrieveRelevant, formatMemoryForPrompt } from "@superior-ai/memory";

export async function GET() {
  return NextResponse.json({
    note: "POST to generate a daily intelligence brief. Optional observed metrics + memory query.",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    let memoryNotes: string[] = Array.isArray(body.memoryNotes)
      ? body.memoryNotes.map(String)
      : [];

    if (body.includeMemory !== false) {
      try {
        const q = String(body.memoryQuery ?? body.objective ?? "priorities decisions");
        const records = retrieveRelevant({ query: q, limit: 6 });
        const block = formatMemoryForPrompt(records);
        if (block.trim()) {
          memoryNotes = [...memoryNotes, ...block.split("\n").filter(Boolean).slice(0, 8)];
        }
      } catch {
        /* memory optional */
      }
    }

    const brief = generateDailyBrief({
      product: body.product,
      objective: body.objective,
      observed: body.observed,
      highlights: body.highlights,
      risks: body.risks,
      openTasks: body.openTasks,
      memoryNotes,
    });

    return NextResponse.json(brief);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
