import { NextRequest, NextResponse } from "next/server";
import { buildOpenApiSpec } from "@superior-ai/api-docs";

export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
  const spec = buildOpenApiSpec(baseUrl);
  return NextResponse.json(spec);
}
