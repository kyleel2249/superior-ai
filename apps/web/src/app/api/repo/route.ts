import { NextRequest, NextResponse } from "next/server";
import { repoListFiles, repoReadFile, repoClone } from "@superior-ai/tools";
import { audit } from "@superior-ai/audit";

export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path");
  if (path) {
    const result = await repoReadFile({ path });
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  }
  const result = await repoListFiles({ subpath: req.nextUrl.searchParams.get("subpath") ?? undefined });
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.action === "clone") {
      const result = await repoClone({ url: String(body.url ?? ""), name: body.name });
      audit({
        action: "tool.execute",
        outcome: result.success ? "success" : "failure",
        resourceType: "repo_clone",
        meta: { url: body.url, error: result.error },
      });
      return NextResponse.json(result, { status: result.success ? 201 : 400 });
    }
    if (body.action === "list") {
      return NextResponse.json(await repoListFiles({ subpath: body.subpath, maxEntries: body.maxEntries }));
    }
    if (body.action === "read") {
      return NextResponse.json(await repoReadFile({ path: String(body.path ?? ""), maxBytes: body.maxBytes }));
    }
    return NextResponse.json({ error: "action must be clone | list | read" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
