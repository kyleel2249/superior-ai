/**
 * Autopublish queue — approval required before any live publish.
 */

import { publishPost, type PublishRequest, type PublishResult, type SocialPlatform } from "./publish";

export type QueueItemStatus = "draft" | "scheduled" | "awaiting_approval" | "publishing" | "published" | "failed" | "cancelled";

export interface QueueItem {
  id: string;
  platform: SocialPlatform;
  text: string;
  mediaUrls?: string[];
  scheduledAt?: string;
  status: QueueItemStatus;
  approved: boolean;
  result?: PublishResult;
  createdAt: string;
  updatedAt: string;
}

const queue = new Map<string, QueueItem>();

function qid() {
  return `soc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function enqueuePost(input: {
  platform: SocialPlatform;
  text: string;
  mediaUrls?: string[];
  scheduledAt?: string;
  requestApproval?: boolean;
}): QueueItem {
  const id = qid();
  const item: QueueItem = {
    id,
    platform: input.platform,
    text: input.text,
    mediaUrls: input.mediaUrls,
    scheduledAt: input.scheduledAt,
    status: input.requestApproval !== false ? "awaiting_approval" : "draft",
    approved: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  queue.set(id, item);
  return item;
}

export function listQueue(filter?: { status?: QueueItemStatus }): QueueItem[] {
  let rows = [...queue.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (filter?.status) rows = rows.filter((r) => r.status === filter.status);
  return rows;
}

export function getQueueItem(id: string): QueueItem | null {
  return queue.get(id) ?? null;
}

export function approveQueueItem(id: string): QueueItem | null {
  const item = queue.get(id);
  if (!item) return null;
  item.approved = true;
  item.status = item.scheduledAt ? "scheduled" : "awaiting_approval";
  // Ready for publish action
  if (!item.scheduledAt) item.status = "awaiting_approval";
  item.updatedAt = new Date().toISOString();
  // Mark as approved - publish still needs explicit publishQueueItem
  item.status = "scheduled";
  return item;
}

export async function publishQueueItem(id: string, accessToken?: string): Promise<QueueItem | null> {
  const item = queue.get(id);
  if (!item) return null;
  if (!item.approved) {
    item.result = {
      success: false,
      platform: item.platform,
      status: "failed",
      error: "Not approved — call approve first, then publish",
    };
    item.status = "failed";
    item.updatedAt = new Date().toISOString();
    return item;
  }
  item.status = "publishing";
  item.updatedAt = new Date().toISOString();

  const req: PublishRequest = {
    platform: item.platform,
    text: item.text,
    mediaUrls: item.mediaUrls,
    scheduledAt: item.scheduledAt,
    accessToken,
  };
  const result = await publishPost(req);
  item.result = result;
  item.status = result.success ? "published" : "failed";
  item.updatedAt = new Date().toISOString();
  return item;
}

export function cancelQueueItem(id: string): QueueItem | null {
  const item = queue.get(id);
  if (!item) return null;
  if (item.status === "published") return item;
  item.status = "cancelled";
  item.updatedAt = new Date().toISOString();
  return item;
}

export function batchEnqueue(
  text: string,
  platforms: SocialPlatform[],
  mediaUrls?: string[]
): QueueItem[] {
  return platforms.map((platform) =>
    enqueuePost({ platform, text, mediaUrls, requestApproval: true })
  );
}
