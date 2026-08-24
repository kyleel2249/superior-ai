/**
 * Marketing & revenue funnel attribution
 * Accepts observed events only — never invents conversion numbers.
 */

export type FunnelEventType =
  | "impression"
  | "click"
  | "visit"
  | "lead"
  | "sql"
  | "opportunity"
  | "won"
  | "revenue";

export interface AttributionEvent {
  id: string;
  type: FunnelEventType;
  campaignId?: string;
  channel?: string;
  source?: string;
  medium?: string;
  content?: string;
  value?: number;
  currency?: string;
  at: string;
  meta?: Record<string, string>;
}

export interface ChannelRollup {
  channel: string;
  impressions: number;
  clicks: number;
  visits: number;
  leads: number;
  sqls: number;
  opportunities: number;
  wins: number;
  revenue: number;
  /** Rates only when denominators exist */
  ctr: number | null;
  visitToLead: number | null;
  leadToSql: number | null;
  sqlToWin: number | null;
}

export interface CampaignRollup {
  campaignId: string;
  events: number;
  leads: number;
  revenue: number;
  channels: string[];
}

const events: AttributionEvent[] = [];

function eid() {
  return `att_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function recordAttributionEvent(
  input: Omit<AttributionEvent, "id" | "at"> & { at?: string }
): AttributionEvent {
  const row: AttributionEvent = {
    id: eid(),
    type: input.type,
    campaignId: input.campaignId,
    channel: input.channel,
    source: input.source,
    medium: input.medium,
    content: input.content,
    value: input.value,
    currency: input.currency ?? "USD",
    at: input.at ?? new Date().toISOString(),
    meta: input.meta,
  };
  events.push(row);
  if (events.length > 10000) events.shift();
  return row;
}

export function listAttributionEvents(limit = 100): AttributionEvent[] {
  return [...events].reverse().slice(0, limit);
}

function rate(num: number, den: number): number | null {
  if (den <= 0) return null;
  return Math.round((num / den) * 10000) / 10000;
}

export function rollupByChannel(): ChannelRollup[] {
  const map = new Map<string, ChannelRollup>();
  const ensure = (ch: string) => {
    if (!map.has(ch)) {
      map.set(ch, {
        channel: ch,
        impressions: 0,
        clicks: 0,
        visits: 0,
        leads: 0,
        sqls: 0,
        opportunities: 0,
        wins: 0,
        revenue: 0,
        ctr: null,
        visitToLead: null,
        leadToSql: null,
        sqlToWin: null,
      });
    }
    return map.get(ch)!;
  };

  for (const e of events) {
    const ch = e.channel || e.source || "unknown";
    const r = ensure(ch);
    switch (e.type) {
      case "impression":
        r.impressions += 1;
        break;
      case "click":
        r.clicks += 1;
        break;
      case "visit":
        r.visits += 1;
        break;
      case "lead":
        r.leads += 1;
        break;
      case "sql":
        r.sqls += 1;
        break;
      case "opportunity":
        r.opportunities += 1;
        break;
      case "won":
        r.wins += 1;
        break;
      case "revenue":
        r.revenue += e.value ?? 0;
        break;
    }
  }

  for (const r of map.values()) {
    r.ctr = rate(r.clicks, r.impressions);
    r.visitToLead = rate(r.leads, r.visits);
    r.leadToSql = rate(r.sqls, r.leads);
    r.sqlToWin = rate(r.wins, r.sqls);
  }

  return [...map.values()].sort((a, b) => b.leads - a.leads || b.revenue - a.revenue);
}

export function rollupByCampaign(): CampaignRollup[] {
  const map = new Map<string, CampaignRollup>();
  for (const e of events) {
    const id = e.campaignId || "unattributed";
    const cur = map.get(id) ?? {
      campaignId: id,
      events: 0,
      leads: 0,
      revenue: 0,
      channels: [],
    };
    cur.events += 1;
    if (e.type === "lead" || e.type === "sql") cur.leads += 1;
    if (e.type === "revenue" || e.type === "won") cur.revenue += e.value ?? 0;
    if (e.channel && !cur.channels.includes(e.channel)) cur.channels.push(e.channel);
    map.set(id, cur);
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue || b.leads - a.leads);
}

export function funnelSummary(): {
  totals: Record<FunnelEventType, number>;
  revenue: number;
  note: string;
} {
  const totals: Record<FunnelEventType, number> = {
    impression: 0,
    click: 0,
    visit: 0,
    lead: 0,
    sql: 0,
    opportunity: 0,
    won: 0,
    revenue: 0,
  };
  let revenue = 0;
  for (const e of events) {
    totals[e.type] += 1;
    if (e.type === "revenue" || e.type === "won") revenue += e.value ?? 0;
  }
  return {
    totals,
    revenue,
    note: "Derived only from recorded events. Empty funnel means no events yet — not zero performance.",
  };
}

/** Demo seed — labeled as mock, for UI testing */
export function seedDemoAttribution(): { count: number } {
  const demo = [
    { type: "impression" as const, channel: "organic", campaignId: "seo-pillar" },
    { type: "impression" as const, channel: "organic", campaignId: "seo-pillar" },
    { type: "click" as const, channel: "organic", campaignId: "seo-pillar" },
    { type: "visit" as const, channel: "organic", campaignId: "seo-pillar" },
    { type: "lead" as const, channel: "organic", campaignId: "seo-pillar" },
    { type: "impression" as const, channel: "paid_social", campaignId: "ugc-test" },
    { type: "click" as const, channel: "paid_social", campaignId: "ugc-test" },
    { type: "visit" as const, channel: "paid_social", campaignId: "ugc-test" },
    { type: "lead" as const, channel: "paid_social", campaignId: "ugc-test" },
    { type: "sql" as const, channel: "paid_social", campaignId: "ugc-test" },
    { type: "won" as const, channel: "paid_social", campaignId: "ugc-test", value: 12000 },
    { type: "revenue" as const, channel: "paid_social", campaignId: "ugc-test", value: 12000 },
  ];
  for (const d of demo) {
    recordAttributionEvent({ ...d, source: "demo_seed" });
  }
  return { count: demo.length };
}
