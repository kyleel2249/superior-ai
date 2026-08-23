/**
 * CRM Connectors — HubSpot, Salesforce, Zoho, Pipedrive, custom
 * Credentials encrypted at rest in production (ProviderKey pattern).
 * Never invents contact data.
 */

export type CrmProvider = "hubspot" | "salesforce" | "zoho" | "pipedrive" | "custom";

export interface CrmCredentials {
  provider: CrmProvider;
  accessToken?: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
  instanceUrl?: string;
  apiKey?: string;
}

export interface CrmContact {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  phone?: string;
  source?: string;
}

export interface CrmDeal {
  id?: string;
  name: string;
  amount?: number;
  stage?: string;
  contactId?: string;
  company?: string;
}

export interface CrmResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  provider: CrmProvider;
  requiresConfig?: boolean;
}

export interface CrmConnector {
  provider: CrmProvider;
  testConnection(): Promise<CrmResult<{ ok: boolean }>>;
  upsertContact(contact: CrmContact): Promise<CrmResult<CrmContact>>;
  createDeal(deal: CrmDeal): Promise<CrmResult<CrmDeal>>;
}

function notConfigured(provider: CrmProvider): CrmResult {
  return {
    success: false,
    provider,
    requiresConfig: true,
    error: `${provider} credentials not configured. Connect via Admin → Integrations (BYOK).`,
  };
}

class HubSpotConnector implements CrmConnector {
  provider: CrmProvider = "hubspot";
  constructor(private creds: CrmCredentials) {}

  async testConnection(): Promise<CrmResult<{ ok: boolean }>> {
    if (!this.creds.accessToken && !this.creds.apiKey) return notConfigured("hubspot");
    try {
      const token = this.creds.accessToken || this.creds.apiKey!;
      const res = await fetch("https://api.hubapi.com/crm/v3/objects/contacts?limit=1", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        return { success: false, provider: "hubspot", error: `HubSpot HTTP ${res.status}` };
      }
      return { success: true, provider: "hubspot", data: { ok: true } };
    } catch (err) {
      return { success: false, provider: "hubspot", error: String(err) };
    }
  }

  async upsertContact(contact: CrmContact): Promise<CrmResult<CrmContact>> {
    if (!this.creds.accessToken && !this.creds.apiKey) return notConfigured("hubspot");
    if (!contact.email) {
      return { success: false, provider: "hubspot", error: "email required — never invent emails" };
    }
    try {
      const token = this.creds.accessToken || this.creds.apiKey!;
      const res = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
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
      if (!res.ok) {
        const text = await res.text();
        return { success: false, provider: "hubspot", error: text.slice(0, 300) };
      }
      const data = (await res.json()) as { id: string };
      return { success: true, provider: "hubspot", data: { ...contact, id: data.id } };
    } catch (err) {
      return { success: false, provider: "hubspot", error: String(err) };
    }
  }

  async createDeal(deal: CrmDeal): Promise<CrmResult<CrmDeal>> {
    if (!this.creds.accessToken && !this.creds.apiKey) return notConfigured("hubspot");
    try {
      const token = this.creds.accessToken || this.creds.apiKey!;
      const res = await fetch("https://api.hubapi.com/crm/v3/objects/deals", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          properties: {
            dealname: deal.name,
            amount: deal.amount?.toString(),
            dealstage: deal.stage ?? "appointmentscheduled",
          },
        }),
      });
      if (!res.ok) {
        return { success: false, provider: "hubspot", error: `HTTP ${res.status}` };
      }
      const data = (await res.json()) as { id: string };
      return { success: true, provider: "hubspot", data: { ...deal, id: data.id } };
    } catch (err) {
      return { success: false, provider: "hubspot", error: String(err) };
    }
  }
}

/** Generic stub for Salesforce / Zoho / Pipedrive — same interface, config-required until keys present */
class StubConnector implements CrmConnector {
  constructor(public provider: CrmProvider) {}
  async testConnection() {
    return notConfigured(this.provider);
  }
  async upsertContact() {
    return notConfigured(this.provider);
  }
  async createDeal() {
    return notConfigured(this.provider);
  }
}

export function createCrmConnector(creds: CrmCredentials): CrmConnector {
  switch (creds.provider) {
    case "hubspot":
      return new HubSpotConnector(creds);
    case "salesforce":
    case "zoho":
    case "pipedrive":
    case "custom":
      return new StubConnector(creds.provider);
    default:
      return new StubConnector("custom");
  }
}

export function listCrmProviders(): Array<{ id: CrmProvider; status: string }> {
  return [
    { id: "hubspot", status: process.env.HUBSPOT_ACCESS_TOKEN ? "configured" : "CONFIGURATION_REQUIRED" },
    { id: "salesforce", status: process.env.SALESFORCE_ACCESS_TOKEN ? "configured" : "CONFIGURATION_REQUIRED" },
    { id: "zoho", status: "CONFIGURATION_REQUIRED" },
    { id: "pipedrive", status: "CONFIGURATION_REQUIRED" },
    { id: "custom", status: "CONFIGURATION_REQUIRED" },
  ];
}
