export type CrmProvider = "hubspot" | "salesforce";

export interface CrmCredentials {
  provider: CrmProvider;
  accessToken?: string;
  apiKey?: string;
  instanceUrl?: string; // required for salesforce
}

export interface CrmContact {
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  phone?: string;
}

export interface CrmDeal {
  name: string;
  amount?: number;
  stage?: string;
  contactEmail?: string;
}

export interface CrmResult {
  ok: boolean;
  provider: CrmProvider;
  id?: string;
  status?: number;
  error?: string;
}

export interface CrmConnector {
  provider: CrmProvider;
  testConnection(): Promise<CrmResult>;
  upsertContact(contact: CrmContact): Promise<CrmResult>;
  createDeal(deal: CrmDeal): Promise<CrmResult>;
}

// Only the two official platform APIs are implemented — no scraping, no ToS bypass.
export function listCrmProviders(): Array<{ provider: CrmProvider; label: string; requires: string[] }> {
  return [
    { provider: "hubspot", label: "HubSpot", requires: ["accessToken (private app token)"] },
    { provider: "salesforce", label: "Salesforce", requires: ["accessToken", "instanceUrl"] },
  ];
}

class HubSpotConnector implements CrmConnector {
  readonly provider = "hubspot" as const;
  constructor(private creds: CrmCredentials) {}

  private headers() {
    return { Authorization: `Bearer ${this.creds.accessToken}`, "Content-Type": "application/json" };
  }

  async testConnection(): Promise<CrmResult> {
    if (!this.creds.accessToken) return { ok: false, provider: this.provider, error: "accessToken required" };
    try {
      const res = await fetch("https://api.hubapi.com/crm/v3/objects/contacts?limit=1", { headers: this.headers() });
      return { ok: res.ok, provider: this.provider, status: res.status, error: res.ok ? undefined : await res.text() };
    } catch (err) {
      return { ok: false, provider: this.provider, error: err instanceof Error ? err.message : String(err) };
    }
  }

  async upsertContact(contact: CrmContact): Promise<CrmResult> {
    if (!this.creds.accessToken) return { ok: false, provider: this.provider, error: "accessToken required" };
    try {
      const res = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({
          properties: {
            email: contact.email,
            firstname: contact.firstName,
            lastname: contact.lastName,
            company: contact.company,
            phone: contact.phone,
          },
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
      return { ok: res.ok, provider: this.provider, status: res.status, id: data.id, error: res.ok ? undefined : data.message };
    } catch (err) {
      return { ok: false, provider: this.provider, error: err instanceof Error ? err.message : String(err) };
    }
  }

  async createDeal(deal: CrmDeal): Promise<CrmResult> {
    if (!this.creds.accessToken) return { ok: false, provider: this.provider, error: "accessToken required" };
    try {
      const res = await fetch("https://api.hubapi.com/crm/v3/objects/deals", {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({ properties: { dealname: deal.name, amount: deal.amount, dealstage: deal.stage } }),
      });
      const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
      return { ok: res.ok, provider: this.provider, status: res.status, id: data.id, error: res.ok ? undefined : data.message };
    } catch (err) {
      return { ok: false, provider: this.provider, error: err instanceof Error ? err.message : String(err) };
    }
  }
}

class SalesforceConnector implements CrmConnector {
  readonly provider = "salesforce" as const;
  constructor(private creds: CrmCredentials) {}

  private base(): string | null {
    return this.creds.instanceUrl ? this.creds.instanceUrl.replace(/\/$/, "") : null;
  }
  private headers() {
    return { Authorization: `Bearer ${this.creds.accessToken}`, "Content-Type": "application/json" };
  }

  async testConnection(): Promise<CrmResult> {
    const base = this.base();
    if (!this.creds.accessToken || !base) return { ok: false, provider: this.provider, error: "accessToken and instanceUrl required" };
    try {
      const res = await fetch(`${base}/services/data/v59.0/sobjects`, { headers: this.headers() });
      return { ok: res.ok, provider: this.provider, status: res.status, error: res.ok ? undefined : await res.text() };
    } catch (err) {
      return { ok: false, provider: this.provider, error: err instanceof Error ? err.message : String(err) };
    }
  }

  async upsertContact(contact: CrmContact): Promise<CrmResult> {
    const base = this.base();
    if (!this.creds.accessToken || !base) return { ok: false, provider: this.provider, error: "accessToken and instanceUrl required" };
    try {
      const res = await fetch(`${base}/services/data/v59.0/sobjects/Contact`, {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({ Email: contact.email, FirstName: contact.firstName, LastName: contact.lastName ?? "Unknown", Phone: contact.phone }),
      });
      const data = (await res.json().catch(() => ({}))) as { id?: string; errors?: unknown };
      return { ok: res.ok, provider: this.provider, status: res.status, id: data.id, error: res.ok ? undefined : JSON.stringify(data.errors) };
    } catch (err) {
      return { ok: false, provider: this.provider, error: err instanceof Error ? err.message : String(err) };
    }
  }

  async createDeal(deal: CrmDeal): Promise<CrmResult> {
    const base = this.base();
    if (!this.creds.accessToken || !base) return { ok: false, provider: this.provider, error: "accessToken and instanceUrl required" };
    try {
      const res = await fetch(`${base}/services/data/v59.0/sobjects/Opportunity`, {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({ Name: deal.name, Amount: deal.amount, StageName: deal.stage ?? "Prospecting", CloseDate: new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10) }),
      });
      const data = (await res.json().catch(() => ({}))) as { id?: string; errors?: unknown };
      return { ok: res.ok, provider: this.provider, status: res.status, id: data.id, error: res.ok ? undefined : JSON.stringify(data.errors) };
    } catch (err) {
      return { ok: false, provider: this.provider, error: err instanceof Error ? err.message : String(err) };
    }
  }
}

export function createCrmConnector(creds: CrmCredentials): CrmConnector {
  if (creds.provider === "salesforce") return new SalesforceConnector(creds);
  return new HubSpotConnector(creds);
}
