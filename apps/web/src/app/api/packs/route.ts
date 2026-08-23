import { NextRequest, NextResponse } from "next/server";
import {
  listCatalog,
  getPack,
  installPack,
  installPackVerified,
  uninstallPack,
  listInstalled,
  publishPack,
  listPublished,
  signPackHs256,
  verifyPackSignature,
  rankCatalog,
  recordPackInstall,
  ratePack,
  setFeatured,
  getPackMetrics,
  scorePack,
  semanticSearchPacks,
  searchAndRank,
  ensurePackEmbeddings,
  type PackCategory,
  type SignedPackManifest,
} from "@superior-ai/agents";
import { checkoutAgentPack, listPricedPacks } from "@superior-ai/billing";
import { audit } from "@superior-ai/audit";
import { getSession, getSessionFromCookies } from "@superior-ai/auth";

export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get("organizationId") ?? "org_dev";
  const category = req.nextUrl.searchParams.get("category") as PackCategory | null;
  const id = req.nextUrl.searchParams.get("id");
  const ranked = req.nextUrl.searchParams.get("ranked") === "1";
  const q = req.nextUrl.searchParams.get("q")?.trim();

  if (id) {
    const pack = getPack(id);
    if (!pack) return NextResponse.json({ error: "not found" }, { status: 404 });
    const signed = signPackHs256(pack);
    const scored = scorePack(pack);
    return NextResponse.json({
      ...signed,
      signatureValid: verifyPackSignature(signed).valid,
      ...scored,
      rawMetrics: getPackMetrics(id),
    });
  }

  // Semantic / lexical search
  if (q) {
    const rankBlend = Number(req.nextUrl.searchParams.get("rankBlend") ?? 0.25);
    const limit = Number(req.nextUrl.searchParams.get("limit") ?? 10);
    if (ranked) {
      const rankedHits = await searchAndRank({
        query: q,
        category: category ?? undefined,
        limit,
      });
      return NextResponse.json({
        query: q,
        ranked: rankedHits,
        installed: listInstalled(orgId),
      });
    }
    const result = await semanticSearchPacks({
      query: q,
      category: category ?? undefined,
      limit,
      rankBlend,
    });
    return NextResponse.json({
      ...result,
      installed: listInstalled(orgId),
    });
  }

  if (ranked) {
    return NextResponse.json({
      ranked: rankCatalog({
        category: category ?? undefined,
        organizationId: orgId,
        limit: Number(req.nextUrl.searchParams.get("limit") ?? 50),
      }),
      installed: listInstalled(orgId),
      priced: listPricedPacks(),
    });
  }

  return NextResponse.json({
    catalog: listCatalog(category ? { category } : undefined),
    installed: listInstalled(orgId),
    published: listPublished(),
    priced: listPricedPacks(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const session =
      getSession(req.headers.get("authorization")) ||
      getSessionFromCookies(req.headers.get("cookie"));
    const organizationId = body.organizationId ?? session?.user.organizationId ?? "org_dev";

    if (body.action === "search") {
      const result = await semanticSearchPacks({
        query: String(body.query ?? ""),
        category: body.category,
        limit: body.limit ?? 10,
        rankBlend: body.rankBlend ?? 0.25,
      });
      return NextResponse.json(result);
    }

    if (body.action === "embed_catalog") {
      const stats = await ensurePackEmbeddings();
      return NextResponse.json(stats);
    }

    if (body.action === "install") {
      const result = body.signed
        ? installPackVerified({
            packId: body.packId,
            organizationId,
            signed: body.signed as SignedPackManifest,
          })
        : installPack({ packId: body.packId, organizationId });
      if (result.ok) {
        recordPackInstall(body.packId);
        audit({
          action: "admin.config",
          actorId: session?.user.id,
          organizationId,
          resourceType: "agent_pack",
          resourceId: body.packId,
          outcome: "success",
          meta: { action: "install" },
        });
      }
      return NextResponse.json(result, { status: result.ok ? 200 : 400 });
    }

    if (body.action === "uninstall") {
      const ok = uninstallPack(body.packId, organizationId);
      return NextResponse.json({ ok }, { status: ok ? 200 : 404 });
    }

    if (body.action === "publish") {
      if (!body.pack) {
        return NextResponse.json({ error: "pack manifest required" }, { status: 400 });
      }
      const signed = publishPack(body.pack, { usePlatformSign: true });
      return NextResponse.json(signed, { status: 201 });
    }

    if (body.action === "verify") {
      return NextResponse.json(verifyPackSignature(body.signed ?? body));
    }

    if (body.action === "checkout") {
      const result = await checkoutAgentPack({
        packId: body.packId,
        email: body.email ?? session?.user.email,
        customerId: body.customerId,
        organizationId,
      });
      return NextResponse.json(result, { status: result.url ? 200 : 400 });
    }

    if (body.action === "rate") {
      const result = ratePack(String(body.packId), Number(body.stars));
      return NextResponse.json(result, { status: result.ok ? 200 : 400 });
    }

    if (body.action === "feature") {
      setFeatured(String(body.packId), body.featured !== false);
      return NextResponse.json({ ok: true, metrics: getPackMetrics(body.packId) });
    }

    return NextResponse.json(
      {
        error:
          "action must be search | embed_catalog | install | uninstall | publish | verify | checkout | rate | feature",
      },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
