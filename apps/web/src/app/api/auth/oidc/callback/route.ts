import { NextRequest, NextResponse } from "next/server";
import {
  createSession,
  validateIdToken,
  SESSION_COOKIE,
  sessionCookieOptions,
  OAUTH_STATE_COOKIE,
} from "@superior-ai/auth";
import { audit } from "@superior-ai/audit";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const returnedState = req.nextUrl.searchParams.get("state");
  const expectedState = req.cookies.get(OAUTH_STATE_COOKIE)?.value;

  if (!code) {
    return NextResponse.json({ error: "missing code" }, { status: 400 });
  }

  if (!expectedState || !returnedState || returnedState !== expectedState) {
    audit({
      action: "auth.login",
      outcome: "failure",
      meta: { error: "OAuth state mismatch — possible CSRF attempt or expired login attempt", method: "oidc" },
    });
    return NextResponse.json({ error: "invalid or expired state — restart the login flow" }, { status: 401 });
  }

  const issuer = process.env.AUTH_OIDC_ISSUER;
  const clientId = process.env.AUTH_OIDC_CLIENT_ID;
  const clientSecret = process.env.AUTH_OIDC_CLIENT_SECRET;
  const redirectUri =
    process.env.AUTH_OIDC_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/oidc/callback`;

  if (!issuer || !clientId || !clientSecret) {
    return NextResponse.json({ error: "OIDC env incomplete" }, { status: 500 });
  }

  try {
    const tokenRes = await fetch(`${issuer.replace(/\/$/, "")}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      return NextResponse.json({ error: `token exchange failed: ${text.slice(0, 200)}` }, { status: 502 });
    }

    const tokens = (await tokenRes.json()) as {
      access_token?: string;
      id_token?: string;
    };

    let email = "oidc-user@configured.idp";
    let name = "OIDC User";
    let sub = `oidc_${Date.now()}`;

    if (tokens.id_token) {
      const validation = await validateIdToken(tokens.id_token, {
        issuer,
        audience: clientId,
      });
      if (!validation.valid) {
        audit({
          action: "auth.login",
          outcome: "failure",
          meta: { error: validation.error, method: validation.method },
        });
        return NextResponse.json(
          { error: "ID token validation failed", detail: validation.error },
          { status: 401 }
        );
      }
      const c = validation.claims ?? {};
      email = String(c.email ?? email);
      name = String(c.name ?? c.preferred_username ?? name);
      sub = String(c.sub ?? sub);
    }

    const session = createSession({
      id: sub,
      email,
      name,
      role: "member",
    });

    audit({
      action: "auth.login",
      actorId: session.user.id,
      actorEmail: session.user.email,
      outcome: "success",
      meta: { method: "oidc" },
    });

    const res = NextResponse.redirect(new URL("/chat", req.url));
    res.cookies.set(SESSION_COOKIE, session.token, sessionCookieOptions());
    res.cookies.set(OAUTH_STATE_COOKIE, "", { ...sessionCookieOptions(0), maxAge: 0 });
    return res;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
