import { NextResponse } from "next/server";
import { getAuthMode } from "@superior-ai/auth";

export async function GET() {
  const issuer = process.env.AUTH_OIDC_ISSUER;
  const clientId = process.env.AUTH_OIDC_CLIENT_ID;
  const redirectUri =
    process.env.AUTH_OIDC_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/oidc/callback`;

  if (getAuthMode() !== "oidc" || !issuer || !clientId) {
    return NextResponse.json(
      {
        error: "OIDC not configured",
        required: ["AUTH_OIDC_ISSUER", "AUTH_OIDC_CLIENT_ID", "AUTH_OIDC_CLIENT_SECRET"],
      },
      { status: 400 }
    );
  }

  const authUrl = new URL(`${issuer.replace(/\/$/, "")}/authorize`);
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid profile email");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", `st_${Date.now()}`);

  return NextResponse.redirect(authUrl.toString());
}
