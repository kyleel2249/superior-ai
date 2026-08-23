import { NextRequest, NextResponse } from "next/server";
import {
  registerPublisher,
  linkPackToPublisher,
  recordPackSale,
  listPublishers,
  listRevenueEvents,
  publisherBalance,
} from "@superior-ai/billing";
import { publishPack, signPackHs256, verifyPackSignature } from "@superior-ai/agents";
import { audit } from "@superior-ai/audit";
import { getSession, getSessionFromCookies } from "@superior-ai/auth";

export async function GET(req: NextRequest) {
  const publisherId = req.nextUrl.searchParams.get("publisherId");
  if (publisherId) {
    return NextResponse.json({
      balance: publisherBalance(publisherId),
      events: listRevenueEvents({ publisherId }),
    });
  }
  return NextResponse.json({
    publishers: listPublishers(),
    events: listRevenueEvents().slice(0, 50),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const session =
      getSession(req.headers.get("authorization")) ||
      getSessionFromCookies(req.headers.get("cookie"));

    if (body.action === "register") {
      const account = registerPublisher({
        name: String(body.name ?? ""),
        email: String(body.email ?? session?.user.email ?? ""),
        shareBps: body.shareBps,
      });
      audit({
        action: "admin.config",
        actorId: session?.user.id,
        outcome: "success",
        resourceType: "publisher",
        resourceId: account.id,
      });
      return NextResponse.json(account, { status: 201 });
    }

    if (body.action === "link_pack") {
      const ok = linkPackToPublisher(String(body.packId), String(body.publisherId));
      return NextResponse.json({ ok }, { status: ok ? 200 : 400 });
    }

    if (body.action === "publish_pack") {
      if (!body.pack) {
        return NextResponse.json({ error: "pack required" }, { status: 400 });
      }
      const signed = publishPack(body.pack, { usePlatformSign: true });
      if (body.publisherId) {
        linkPackToPublisher(signed.id, body.publisherId);
      }
      audit({
        action: "admin.config",
        actorId: session?.user.id,
        outcome: "success",
        resourceType: "agent_pack",
        resourceId: signed.id,
        meta: { publisherId: body.publisherId },
      });
      return NextResponse.json(signed, { status: 201 });
    }

    if (body.action === "record_sale") {
      const event = recordPackSale({
        packId: String(body.packId),
        organizationId: body.organizationId,
        grossUsd: Number(body.grossUsd ?? 0),
        stripeSessionId: body.stripeSessionId,
      });
      return NextResponse.json(event, { status: "error" in event ? 400 : 201 });
    }

    if (body.action === "sign_preview") {
      const signed = signPackHs256(body.pack);
      return NextResponse.json({
        signed,
        verification: verifyPackSignature(signed),
      });
    }

    return NextResponse.json(
      { error: "action must be register | link_pack | publish_pack | record_sale | sign_preview" },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
