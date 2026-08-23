import { NextRequest, NextResponse } from "next/server";

/**
 * Edge middleware — lightweight rate limit headers.
 * Full token-bucket runs in Node route handlers via @superior-ai/observability.
 * Here we only add request IDs and basic abuse signals.
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
  if (slot.n > limit) return false;
  return true;
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
  return res;
}

export const config = {
  matcher: ["/api/:path*", "/login", "/chat", "/studio"],
};
