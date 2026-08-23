/**
 * Pack revenue share accounting
 * Records publisher entitlements when add-on packs are sold.
 */

export interface PublisherAccount {
  id: string;
  name: string;
  email: string;
  shareBps: number; // basis points — 7000 = 70% to publisher
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
const packPublisher = new Map<string, string>(); // packId -> publisherId

export function registerPublisher(input: {
  name: string;
  email: string;
  shareBps?: number;
}): PublisherAccount {
  const id = `pub_${Date.now().toString(36)}`;
  const account: PublisherAccount = {
    id,
    name: input.name,
    email: input.email,
    shareBps: input.shareBps ?? 7000,
    createdAt: new Date().toISOString(),
  };
  publishers.set(id, account);
  return account;
}

export function linkPackToPublisher(packId: string, publisherId: string): boolean {
  if (!publishers.has(publisherId)) return false;
  packPublisher.set(packId, publisherId);
  return true;
}

export function recordPackSale(input: {
  packId: string;
  organizationId?: string;
  grossUsd: number;
  stripeSessionId?: string;
}): RevenueEvent | { error: string } {
  const publisherId = packPublisher.get(input.packId);
  if (!publisherId) {
    return { error: `No publisher linked for pack ${input.packId}` };
  }
  const pub = publishers.get(publisherId);
  if (!pub) return { error: "Publisher not found" };

  const publisherShareUsd =
    Math.round(input.grossUsd * (pub.shareBps / 10_000) * 1e6) / 1e6;
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

export function listPublishers(): PublisherAccount[] {
  return Array.from(publishers.values());
}

export function listRevenueEvents(filter?: {
  publisherId?: string;
  packId?: string;
}): RevenueEvent[] {
  let list = [...events].reverse();
  if (filter?.publisherId) list = list.filter((e) => e.publisherId === filter.publisherId);
  if (filter?.packId) list = list.filter((e) => e.packId === filter.packId);
  return list;
}

export function publisherBalance(publisherId: string): {
  accruedUsd: number;
  paidUsd: number;
  pendingUsd: number;
} {
  let accrued = 0;
  let paid = 0;
  let pending = 0;
  for (const e of events) {
    if (e.publisherId !== publisherId) continue;
    if (e.status === "accrued") accrued += e.publisherShareUsd;
    else if (e.status === "paid") paid += e.publisherShareUsd;
    else pending += e.publisherShareUsd;
  }
  return { accruedUsd: accrued, paidUsd: paid, pendingUsd: pending };
}
