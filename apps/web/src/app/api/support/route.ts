import { NextRequest, NextResponse } from "next/server";
import {
  openTicket,
  resolveTicket,
  listTickets,
  supportTrendAlerts,
  upsertKbArticle,
  searchKb,
  listKb,
  draftSupportReply,
} from "@superior-ai/support";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (q) return NextResponse.json({ articles: searchKb(q) });
  return NextResponse.json({
    tickets: listTickets(),
    trends: supportTrendAlerts(),
    kb: listKb(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action ?? "open");

    if (action === "open") {
      const ticket = openTicket({
        subject: String(body.subject ?? "Support request"),
        body: String(body.body ?? body.message ?? ""),
        customerId: body.customerId,
      });
      return NextResponse.json(ticket, { status: 201 });
    }
    if (action === "resolve") {
      const t = resolveTicket(body.id, String(body.resolution ?? ""));
      if (!t) return NextResponse.json({ error: "not found" }, { status: 404 });
      return NextResponse.json(t);
    }
    if (action === "kb_upsert") {
      return NextResponse.json(
        upsertKbArticle({
          title: String(body.title ?? "Untitled"),
          body: String(body.body ?? ""),
          tags: body.tags,
        }),
        { status: 201 }
      );
    }
    if (action === "kb_search") {
      return NextResponse.json({ articles: searchKb(String(body.q ?? "")) });
    }
    if (action === "draft_reply") {
      return NextResponse.json(
        draftSupportReply(
          String(body.subject ?? ""),
          String(body.body ?? body.message ?? "")
        )
      );
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
