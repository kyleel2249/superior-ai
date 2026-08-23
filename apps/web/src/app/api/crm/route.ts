import { NextRequest, NextResponse } from "next/server";
import { createCrmConnector, listCrmProviders, type CrmProvider } from "@superior-ai/crm";

export async function GET() {
  return NextResponse.json({ providers: listCrmProviders() });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const provider = (body.provider ?? "hubspot") as CrmProvider;
    const connector = createCrmConnector({
      provider,
      accessToken: body.accessToken || process.env.HUBSPOT_ACCESS_TOKEN || process.env.SALESFORCE_ACCESS_TOKEN,
      apiKey: body.apiKey || process.env.HUBSPOT_API_KEY,
      instanceUrl: body.instanceUrl || process.env.SALESFORCE_INSTANCE_URL,
    });

    if (body.action === "test") {
      return NextResponse.json(await connector.testConnection());
    }
    if (body.action === "upsert_contact") {
      return NextResponse.json(await connector.upsertContact(body.contact ?? {}));
    }
    if (body.action === "create_deal") {
      return NextResponse.json(await connector.createDeal(body.deal ?? { name: "Untitled" }));
    }
    return NextResponse.json({ error: "action must be test | upsert_contact | create_deal" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
