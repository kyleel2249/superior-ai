export interface PublisherAccount {
  id: string;
  name: string;
  email: string;
  shareBps: number;
  createdAt: string;
}

export interface RevenueEvent {
  id: string;
  at: string;
  packId: string;
  organizationId?: string;
  publisherId: string;
  grossUsd: number;
  publisherShareUsd: number;
  platformShareUsd: number;
  currency: string;
  stripeSessionId?: string;
  status: "pending" | "accrued" | "paid";
}

const publishers = new Map<string, PublisherAccount>();
const events: RevenueEvent[] = [];
const packPublisher = new Map<string, string>();

export function registerPublisher(input: { name: string; email: string; shareBps?: number }) {
  const id = `pub_${Date.now().toString(36)}`;
  const account: PublisherAccount = {
    id, name: input.name, email: input.email,
    shareBps: input.shareBps ?? 7000,
    createdAt: new Date().toISOString(),
  };
  publishers.set(id, account);
  return account;
}

export function linkPackToPublisher(packId: string, publisherId: string) {
  if (!publishers.has(publisherId)) return false;
  packPublisher.set(packId, publisherId);
  return true;
}

export function recordPackSale(input: {
  packId: string;
  organizationId?: string;
  grossUsd: number;
  stripeSessionId?: string;
}) {
  const publisherId = packPublisher.get(input.packId);
  if (!publisherId) return { error: `No publisher linked for pack ${input.packId}` };
  const pub = publishers.get(publisherId);
  if (!pub) return { error: "Publisher not found" };
  const publisherShareUsd = Math.round(input.grossUsd * (pub.shareBps / 10_000) * 1e6) / 1e6;
  const platformShareUsd = Math.round((input.grossUsd - publisherShareUsd) * 1e6) / 1e6;
  const event: RevenueEvent = {
    id: `rev_${Date.now().toString(36)}`,
    at: new Date().toISOString(),
    packId: input.packId,
    organizationId: input.organizationId,
    publisherId,
    grossUsd: input.grossUsd,
    publisherShareUsd,
    platformShareUsd,
    currency: "usd",
    stripeSessionId: input.stripeSessionId,
    status: "accrued",
  };
  events.push(event);
  return event;
}

export function listPublishers() { return Array.from(publishers.values()); }
export function listRevenueEvents(filter?: { publisherId?: string; packId?: string }) {
  let list = [...events].reverse();
  if (filter?.publisherId) list = list.filter((e) => e.publisherId === filter.publisherId);
  if (filter?.packId) list = list.filter((e) => e.packId === filter.packId);
  return list;
}

export function publisherBalance(publisherId: string) {
  let accruedUsd = 0, paidUsd = 0, pendingUsd = 0;
  for (const e of events) {
    if (e.publisherId !== publisherId) continue;
    if (e.status === "accrued") accruedUsd += e.publisherShareUsd;
    else if (e.status === "paid") paidUsd += e.publisherShareUsd;
    else pendingUsd += e.publisherShareUsd;
  }
  return { accruedUsd, paidUsd, pendingUsd };
}
