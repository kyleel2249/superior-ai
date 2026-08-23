import { NextRequest, NextResponse } from "next/server";
import { openTicket, resolveTicket, listTickets, supportTrendAlerts } from "@superior-ai/support";

export async function GET() {
  return NextResponse.json({ tickets: listTickets(), trends: supportTrendAlerts() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.action === "open" || !body.action) {
    const ticket = openTicket({
      subject: String(body.subject ?? "Support request"),
      body: String(body.body ?? body.message ?? ""),
      customerId: body.customerId,
    });
    return NextResponse.json(ticket, { status: 201 });
  }
  if (body.action === "resolve") {
    const t = resolveTicket(body.id, String(body.resolution ?? ""));
    if (!t) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(t);
  }
  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
