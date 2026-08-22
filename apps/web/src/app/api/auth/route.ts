import { NextRequest, NextResponse } from "next/server";
import { devLogin, getSession, destroySession, getAuthMode, hasPermission } from "@superior-ai/auth";

export async function GET(req: NextRequest) {
  const session = getSession(req.headers.get("authorization"));
  return NextResponse.json({
    mode: getAuthMode(),
    authenticated: Boolean(session),
    user: session?.user ?? null,
    oidcReady: getAuthMode() === "oidc",
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (body.action === "logout") {
    const auth = req.headers.get("authorization");
    if (auth) destroySession(auth);
    return NextResponse.json({ ok: true });
  }
  if (process.env.NODE_ENV === "production" && getAuthMode() === "oidc") {
    return NextResponse.json({ error: "Use OIDC login in production" }, { status: 401 });
  }
  const session = devLogin(body.email, body.role ?? "owner");
  return NextResponse.json({
    token: session.token,
    user: session.user,
    expiresAt: session.expiresAt,
    permissions: {
      run_orchestrator: hasPermission(session.user, "run_orchestrator"),
      manage_providers: hasPermission(session.user, "manage_providers"),
    },
  });
}
