import { NextRequest, NextResponse } from "next/server";

/**
 * Edge middleware — rate limit + security headers.
 * Full token-bucket also available in Node via @superior-ai/observability.
 */

const hits = new Map<string, { n: number; t: number }>();

function edgeLimit(ip: string, limit = 180, windowMs = 60_000): boolean {
  const now = Date.now();
  const slot = hits.get(ip);
  if (!slot || now - slot.t > windowMs) {
    hits.set(ip, { n: 1, t: now });
    return true;
  }
  slot.n += 1;
  return slot.n <= limit;
}

export function middleware(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const requestId = `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  if (req.nextUrl.pathname.startsWith("/api/")) {
    if (!edgeLimit(ip)) {
      return NextResponse.json(
        { error: "Rate limit exceeded", retryAfterSec: 60 },
        { status: 429, headers: { "Retry-After": "60", "X-Request-Id": requestId } }
      );
    }
  }

  const res = NextResponse.next();
  res.headers.set("X-Request-Id", requestId);
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return res;
}

export const config = {
  matcher: ["/api/:path*", "/login", "/chat", "/studio", "/command", "/admin/:path*"],
};
