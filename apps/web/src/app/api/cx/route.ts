import { NextRequest, NextResponse } from "next/server";
import { createPersona, listPersonas, evolvePersona, buildJourney, cxHealthScore } from "@superior-ai/cx";

export async function GET() {
  return NextResponse.json({ personas: listPersonas() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.action === "persona") {
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
  if (body.action === "evolve") {
    const p = evolvePersona(body.id, body.patch ?? {});
    if (!p) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(p);
  }
  if (body.action === "journey") {
    const journey = buildJourney({
      product: String(body.product ?? "product"),
      persona: body.persona,
      industry: body.industry,
    });
    return NextResponse.json({ journey, health: cxHealthScore(journey) });
  }
  return NextResponse.json({ error: "action must be persona | evolve | journey" }, { status: 400 });
}
