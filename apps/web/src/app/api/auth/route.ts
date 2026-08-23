import { NextRequest, NextResponse } from "next/server";
import { devLogin, getSession, getSessionFromCookies, destroySession, getAuthMode, hasPermission } from "@superior-ai/auth";

export async function GET(req: NextRequest) {
  const session =
    getSession(req.headers.get("authorization")) || getSessionFromCookies(req.headers.get("cookie"));
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
    const cookieToken = getSessionFromCookies(req.headers.get("cookie"))?.token;
    if (cookieToken) destroySession(cookieToken);
    const res = NextResponse.json({ ok: true });
    res.cookies.delete("superior_session");
    return res;
  }
  if (process.env.NODE_ENV === "production" && getAuthMode() === "oidc") {
    return NextResponse.json({ error: "Use OIDC login in production" }, { status: 401 });
  }
  const session = devLogin(body.email, body.role ?? "owner");
  const res = NextResponse.json({
    token: session.token,
    user: session.user,
    expiresAt: session.expiresAt,
    permissions: {
      run_orchestrator: hasPermission(session.user, "run_orchestrator"),
      manage_providers: hasPermission(session.user, "manage_providers"),
    },
  });
  res.cookies.set("superior_session", session.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(session.expiresAt),
  });
  return res;
}
