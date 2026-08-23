/**
 * packages/crm/src/index.ts already declared `export * from "./connectors"`
 * before this file existed. apps/web/src/app/api/crm/route.ts calls
 * createCrmConnector({provider, accessToken, apiKey, instanceUrl}) and then
 * connector.testConnection() / .upsertContact() / .createDeal(). Official
 * platform APIs only, matching the repo's README design rule.
 */

export type CrmProvider = "hubspot" | "salesforce";

export interface CrmConnectorConfig {
  provider: CrmProvider;
  accessToken?: string;
  apiKey?: string;
  instanceUrl?: string;
}

export interface CrmContact {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
}

export interface CrmDeal {
  name: string;
  amountUsd?: number;
  stage?: string;
  contactEmail?: string;
}

export interface CrmActionResult {
  success: boolean;
  provider: CrmProvider;
  id?: string;
  message: string;
}

export interface CrmConnector {
  testConnection(): Promise<CrmActionResult>;
  upsertContact(contact: CrmContact): Promise<CrmActionResult>;
  createDeal(deal: CrmDeal): Promise<CrmActionResult>;
}

export function listCrmProviders(): Array<{ provider: CrmProvider; configured: boolean }> {
  return [
    { provider: "hubspot", configured: Boolean(process.env.HUBSPOT_ACCESS_TOKEN || process.env.HUBSPOT_API_KEY) },
    { provider: "salesforce", configured: Boolean(process.env.SALESFORCE_ACCESS_TOKEN && process.env.SALESFORCE_INSTANCE_URL) },
  ];
}

class HubSpotConnector implements CrmConnector {
  constructor(private token?: string) {}

  private headers(): Record<string, string> {
    return { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" };
  }

  async testConnection(): Promise<CrmActionResult> {
    if (!this.token) return { success: false, provider: "hubspot", message: "No HubSpot access token configured." };
    const res = await fetch("https://api.hubapi.com/crm/v3/objects/contacts?limit=1", { headers: this.headers() });
    if (!res.ok) return { success: false, provider: "hubspot", message: `HubSpot connection failed: ${res.status} ${(await res.text()).slice(0, 200)}` };
    return { success: true, provider: "hubspot", message: "HubSpot connection OK." };
  }

  async upsertContact(contact: CrmContact): Promise<CrmActionResult> {
    if (!this.token) return { success: false, provider: "hubspot", message: "No HubSpot access token configured." };
    if (!contact.email) return { success: false, provider: "hubspot", message: "Contact email is required to upsert in HubSpot." };
    const res = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${encodeURIComponent(contact.email)}?idProperty=email`, {
      method: "PATCH",
      headers: this.headers(),
      body: JSON.stringify({
        properties: {
          email: contact.email,
          firstname: contact.firstName,
          lastname: contact.lastName,
          phone: contact.phone,
          company: contact.company,
        },
      }),
    });
    if (res.status === 404) {
      const createRes = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({
          properties: { email: contact.email, firstname: contact.firstName, lastname: contact.lastName, phone: contact.phone, company: contact.company },
        }),
      });
      if (!createRes.ok) return { success: false, provider: "hubspot", message: `HubSpot contact create failed: ${createRes.status} ${(await createRes.text()).slice(0, 200)}` };
      const created = (await createRes.json()) as { id: string };
      return { success: true, provider: "hubspot", id: created.id, message: "Contact created in HubSpot." };
    }
    if (!res.ok) return { success: false, provider: "hubspot", message: `HubSpot contact upsert failed: ${res.status} ${(await res.text()).slice(0, 200)}` };
    const updated = (await res.json()) as { id: string };
    return { success: true, provider: "hubspot", id: updated.id, message: "Contact updated in HubSpot." };
  }

  async createDeal(deal: CrmDeal): Promise<CrmActionResult> {
    if (!this.token) return { success: false, provider: "hubspot", message: "No HubSpot access token configured." };
    const res = await fetch("https://api.hubapi.com/crm/v3/objects/deals", {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ properties: { dealname: deal.name, amount: deal.amountUsd, dealstage: deal.stage } }),
    });
    if (!res.ok) return { success: false, provider: "hubspot", message: `HubSpot deal create failed: ${res.status} ${(await res.text()).slice(0, 200)}` };
    const created = (await res.json()) as { id: string };
    return { success: true, provider: "hubspot", id: created.id, message: "Deal created in HubSpot." };
  }
}

class SalesforceConnector implements CrmConnector {
  constructor(private token?: string, private instanceUrl?: string) {}

  private headers(): Record<string, string> {
    return { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" };
  }

  private missingConfigMessage(): string {
    return "Salesforce requires both an access token and an instance URL.";
  }

  async testConnection(): Promise<CrmActionResult> {
    if (!this.token || !this.instanceUrl) return { success: false, provider: "salesforce", message: this.missingConfigMessage() };
    const res = await fetch(`${this.instanceUrl}/services/data/v60.0/limits`, { headers: this.headers() });
    if (!res.ok) return { success: false, provider: "salesforce", message: `Salesforce connection failed: ${res.status} ${(await res.text()).slice(0, 200)}` };
    return { success: true, provider: "salesforce", message: "Salesforce connection OK." };
  }

  async upsertContact(contact: CrmContact): Promise<CrmActionResult> {
    if (!this.token || !this.instanceUrl) return { success: false, provider: "salesforce", message: this.missingConfigMessage() };
    if (!contact.email) return { success: false, provider: "salesforce", message: "Contact email is required to upsert in Salesforce." };
    const res = await fetch(`${this.instanceUrl}/services/data/v60.0/sobjects/Contact/Email/${encodeURIComponent(contact.email)}`, {
      method: "PATCH",
      headers: this.headers(),
      body: JSON.stringify({ FirstName: contact.firstName, LastName: contact.lastName ?? "Unknown", Phone: contact.phone }),
    });
    if (!res.ok && res.status !== 204) return { success: false, provider: "salesforce", message: `Salesforce contact upsert failed: ${res.status} ${(await res.text()).slice(0, 200)}` };
    return { success: true, provider: "salesforce", message: "Contact upserted in Salesforce." };
  }

  async createDeal(deal: CrmDeal): Promise<CrmActionResult> {
    if (!this.token || !this.instanceUrl) return { success: false, provider: "salesforce", message: this.missingConfigMessage() };
    const res = await fetch(`${this.instanceUrl}/services/data/v60.0/sobjects/Opportunity`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ Name: deal.name, Amount: deal.amountUsd, StageName: deal.stage ?? "Prospecting", CloseDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10) }),
    });
    if (!res.ok) return { success: false, provider: "salesforce", message: `Salesforce deal create failed: ${res.status} ${(await res.text()).slice(0, 200)}` };
    const created = (await res.json()) as { id: string };
    return { success: true, provider: "salesforce", id: created.id, message: "Deal created in Salesforce." };
  }
}

export function createCrmConnector(config: CrmConnectorConfig): CrmConnector {
  switch (config.provider) {
    case "hubspot":
      return new HubSpotConnector(config.accessToken || config.apiKey);
    case "salesforce":
      return new SalesforceConnector(config.accessToken, config.instanceUrl);
    default:
      throw new Error(`Unsupported CRM provider: ${config.provider}`);
  }
}
