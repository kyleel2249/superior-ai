import { describe, it, expect } from "vitest";
import {
  enqueuePost,
  listQueue,
  getQueueItem,
  approveQueueItem,
  publishQueueItem,
  cancelQueueItem,
  batchEnqueue,
} from "../queue";

describe("enqueuePost", () => {
  it("defaults to awaiting_approval and unapproved", () => {
    const item = enqueuePost({ platform: "linkedin", text: "Hello world" });
    expect(item.status).toBe("awaiting_approval");
    expect(item.approved).toBe(false);
  });

  it("requestApproval:false starts as draft instead", () => {
    const item = enqueuePost({ platform: "x", text: "Draft post", requestApproval: false });
    expect(item.status).toBe("draft");
  });

  it("assigns unique ids across rapid calls", () => {
    const a = enqueuePost({ platform: "linkedin", text: "A" });
    const b = enqueuePost({ platform: "linkedin", text: "B" });
    expect(a.id).not.toBe(b.id);
  });
});

describe("publishQueueItem — core safety property: no publish without approval", () => {
  it("refuses to publish an unapproved item and marks it failed with a clear error", async () => {
    const item = enqueuePost({ platform: "linkedin", text: "Never approved" });
    const result = await publishQueueItem(item.id);
    expect(result?.status).toBe("failed");
    expect(result?.result?.success).toBe(false);
    expect(result?.result?.error).toMatch(/approve first/i);
  });

  it("an approved item attempts a real publish call and honestly fails when unconfigured (no token in this environment)", async () => {
    const item = enqueuePost({ platform: "linkedin", text: "Approved post" });
    approveQueueItem(item.id);
    const result = await publishQueueItem(item.id);
    // No real LinkedIn token configured in this environment — must fail
    // honestly, never fabricate a successful publish.
    expect(result?.result?.success).toBe(false);
    expect(result?.result?.status).toBe("CONFIGURATION_REQUIRED");
  });

  it("returns null for publishing a queue item id that doesn't exist", async () => {
    expect(await publishQueueItem("soc_nonexistent")).toBeNull();
  });
});

describe("approveQueueItem", () => {
  it("sets approved:true and moves status to scheduled (documents current behavior)", () => {
    const item = enqueuePost({ platform: "linkedin", text: "To approve" });
    const approved = approveQueueItem(item.id);
    expect(approved?.approved).toBe(true);
    expect(approved?.status).toBe("scheduled");
  });

  it("returns null for a nonexistent item id", () => {
    expect(approveQueueItem("soc_nonexistent")).toBeNull();
  });
});

describe("cancelQueueItem", () => {
  it("cancels a pending item", () => {
    const item = enqueuePost({ platform: "linkedin", text: "Cancel me" });
    const cancelled = cancelQueueItem(item.id);
    expect(cancelled?.status).toBe("cancelled");
  });

  it("refuses to cancel an already-published item (leaves it published)", async () => {
    const item = enqueuePost({ platform: "linkedin", text: "Already live" });
    // Force into published state directly to test the guard, since a real
    // publish always fails without credentials in this environment.
    const stored = getQueueItem(item.id)!;
    stored.status = "published";
    const result = cancelQueueItem(item.id);
    expect(result?.status).toBe("published");
  });
});

describe("listQueue / getQueueItem", () => {
  it("filters by status", () => {
    const draft = enqueuePost({ platform: "x", text: "D", requestApproval: false });
    const pending = enqueuePost({ platform: "x", text: "P" });
    const drafts = listQueue({ status: "draft" });
    expect(drafts.some((i) => i.id === draft.id)).toBe(true);
    expect(drafts.some((i) => i.id === pending.id)).toBe(false);
  });

  it("getQueueItem returns null for an unknown id", () => {
    expect(getQueueItem("soc_unknown")).toBeNull();
  });
});

describe("batchEnqueue", () => {
  it("creates one queue item per platform, all requiring approval", () => {
    const items = batchEnqueue("Cross-post this", ["linkedin", "x", "instagram"]);
    expect(items).toHaveLength(3);
    expect(items.map((i) => i.platform)).toEqual(["linkedin", "x", "instagram"]);
    expect(items.every((i) => i.status === "awaiting_approval")).toBe(true);
  });
});
