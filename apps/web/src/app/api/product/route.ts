import { NextRequest, NextResponse } from "next/server";
import { developConcept, listConcepts, investmentCases } from "@superior-ai/product-lab";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (id) {
    const cases = investmentCases(id);
    if (!cases) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(cases);
  }
  return NextResponse.json({ concepts: listConcepts() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.action === "develop" || !body.action) {
    const concept = developConcept({
      idea: String(body.idea ?? ""),
      customerProblem: body.customerProblem,
      targetMarket: body.targetMarket,
    });
    return NextResponse.json(concept, { status: 201 });
  }
  if (body.action === "investment") {
    const cases = investmentCases(String(body.conceptId));
    if (!cases) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(cases);
  }
  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
