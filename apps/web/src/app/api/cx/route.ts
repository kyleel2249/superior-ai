import { NextRequest, NextResponse } from "next/server";
import {
  createPersona,
  listPersonas,
  evolvePersona,
  buildJourney,
  cxHealthScore,
  analyzeVoc,
  retentionPlaybook,
} from "@superior-ai/cx";

export async function GET() {
  return NextResponse.json({
    personas: listPersonas(),
    actions: ["persona", "evolve", "journey", "voc", "retention"],
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action ?? "journey");

    if (action === "persona") {
      return NextResponse.json(
        createPersona({
          segment: String(body.segment ?? "general"),
          problem: String(body.problem ?? ""),
          name: body.name,
          geography: body.geography,
          industry: body.industry,
          companySize: body.companySize,
          preferredChannel: body.preferredChannel,
        }),
        { status: 201 }
      );
    }
    if (action === "evolve") {
      const p = evolvePersona(body.id, body.patch ?? {});
      if (!p) return NextResponse.json({ error: "not found" }, { status: 404 });
      return NextResponse.json(p);
    }
    if (action === "journey") {
      const journey = buildJourney({
        product: String(body.product ?? "product"),
        persona: body.persona,
        industry: body.industry,
      });
      return NextResponse.json({ journey, health: cxHealthScore(journey) });
    }
    if (action === "voc") {
      const texts = Array.isArray(body.texts)
        ? body.texts.map(String)
        : String(body.text ?? "")
            .split(/\n+/)
            .filter(Boolean);
      return NextResponse.json(analyzeVoc(texts));
    }
    if (action === "retention") {
      return NextResponse.json(retentionPlaybook(String(body.product ?? "product")));
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
