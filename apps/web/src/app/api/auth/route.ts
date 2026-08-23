import { NextRequest, NextResponse } from "next/server";
import {
  devLogin,
  getSession,
  getSessionFromCookies,
  destroySession,
  getAuthMode,
  hasPermission,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@superior-ai/auth";
import { audit } from "@superior-ai/audit";

export async function GET(req: NextRequest) {
  const headerAuth = req.headers.get("authorization");
  const session =
    getSession(headerAuth) || getSessionFromCookies(req.headers.get("cookie"));
  return NextResponse.json({
    mode: getAuthMode(),
    authenticated: Boolean(session),
    user: session?.user ?? null,
    oidcReady: getAuthMode() === "oidc",
    note:
      getAuthMode() === "dev"
        ? "Dev JWT sessions. Set AUTH_SECRET in production. OIDC via AUTH_OIDC_*."
        : "OIDC configured.",
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  if (body.action === "logout") {
    const headerAuth = req.headers.get("authorization");
    const cookieTok = getSessionFromCookies(req.headers.get("cookie"))?.token;
    if (headerAuth) destroySession(headerAuth);
    if (cookieTok) destroySession(cookieTok);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(0), maxAge: 0 });
    return res;
  }

  if (process.env.NODE_ENV === "production" && getAuthMode() === "oidc") {
    return NextResponse.json({ error: "Use OIDC login in production" }, { status: 401 });
  }

  const session = devLogin(body.email, body.role ?? "owner");
  audit({
    action: "auth.login",
    actorId: session.user.id,
    actorEmail: session.user.email,
    organizationId: session.user.organizationId,
    outcome: "success",
    ip: req.headers.get("x-forwarded-for")?.split(",")[0] ?? undefined,
  });
  const res = NextResponse.json({
    token: session.token,
    user: session.user,
    expiresAt: session.expiresAt,
    permissions: {
      run_orchestrator: hasPermission(session.user, "run_orchestrator"),
      manage_providers: hasPermission(session.user, "manage_providers"),
      billing: hasPermission(session.user, "billing"),
    },
  });
  res.cookies.set(SESSION_COOKIE, session.token, sessionCookieOptions());
  return res;
}
