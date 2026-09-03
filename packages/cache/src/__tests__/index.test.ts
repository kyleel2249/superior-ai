import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { cacheSet, cacheGet, cacheDel, cacheClear, cacheStats, cacheGetOrSet, cacheSetBounded } from "../index";

beforeEach(() => {
  cacheClear();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("basic get/set/del", () => {
  it("stores and retrieves a value before expiry", () => {
    cacheSet("k1", { hello: "world" }, 1000);
    expect(cacheGet("k1")).toEqual({ hello: "world" });
  });

  it("returns undefined for a key that was never set", () => {
    expect(cacheGet("never-set")).toBeUndefined();
  });

  it("expires a value exactly after its TTL and purges it on read", () => {
    cacheSet("k2", "value", 1000);
    vi.advanceTimersByTime(999);
    expect(cacheGet("k2")).toBe("value");
    vi.advanceTimersByTime(2);
    expect(cacheGet("k2")).toBeUndefined();
    expect(cacheStats().keys).toBe(0); // confirms the expired entry was actually deleted, not just hidden
  });

  it("cacheDel removes a key immediately regardless of TTL", () => {
    cacheSet("k3", "value", 60_000);
    cacheDel("k3");
    expect(cacheGet("k3")).toBeUndefined();
  });

  it("cacheClear wipes everything", () => {
    cacheSet("a", 1, 60_000);
    cacheSet("b", 2, 60_000);
    cacheClear();
    expect(cacheStats().keys).toBe(0);
  });
});

describe("cacheStats", () => {
  it("purges expired entries as a side effect of checking stats", () => {
    cacheSet("x", 1, 500);
    cacheSet("y", 1, 60_000);
    vi.advanceTimersByTime(600);
    expect(cacheStats().keys).toBe(1); // x expired and was purged, y remains
    expect(cacheGet("y")).toBe(1);
  });
});

describe("cacheGetOrSet", () => {
  it("calls the factory only on a miss, not on a subsequent hit", async () => {
    let calls = 0;
    const factory = async () => {
      calls += 1;
      return "computed";
    };
    const first = await cacheGetOrSet("gos1", 60_000, factory);
    const second = await cacheGetOrSet("gos1", 60_000, factory);
    expect(first).toBe("computed");
    expect(second).toBe("computed");
    expect(calls).toBe(1);
  });

  it("re-invokes the factory once the cached value has expired", async () => {
    let calls = 0;
    const factory = async () => `computed-${++calls}`;
    await cacheGetOrSet("gos2", 500, factory);
    vi.advanceTimersByTime(600);
    const after = await cacheGetOrSet("gos2", 500, factory);
    expect(after).toBe("computed-2");
    expect(calls).toBe(2);
  });
});

describe("cacheSetBounded", () => {
  it("evicts the oldest-inserted key (FIFO) once over the MAX_KEYS capacity", () => {
    // MAX_KEYS is read from CACHE_MAX_KEYS once at module import time, so it
    // can't be overridden per-test — insert past the real default (5000)
    // instead of trying to shrink the bound.
    const overCapacity = 5001;
    for (let i = 0; i < overCapacity; i++) {
      cacheSetBounded(`bulk_${i}`, i, 60_000);
    }
    // Eviction fires once count > MAX_KEYS, so the single oldest entry
    // (bulk_0) should be gone while capacity is otherwise held near the bound.
    expect(cacheGet("bulk_0")).toBeUndefined();
    expect(cacheGet(`bulk_${overCapacity - 1}`)).toBe(overCapacity - 1);
    expect(cacheStats().keys).toBeLessThanOrEqual(overCapacity);
  });
});
