import { describe, it, expect } from "vitest";
import { listSearchEngines, liveSearch } from "../web-search";

describe("listSearchEngines", () => {
  it("regression: Baidu was intentionally removed (never implemented — official API only, never available) and must not reappear", () => {
    const engines = listSearchEngines();
    // Cast through unknown since "baidu" is no longer a valid SearchEngineId
    // at all — TypeScript itself now proves it can't reappear by type.
    const ids = engines.map((e) => e.id as unknown as string);
    expect(ids).not.toContain("baidu");
    expect(engines.some((e) => /baidu/i.test(e.name))).toBe(false);
  });

  it("every engine has a non-empty id, name, and notes — no blank registry entries", () => {
    const engines = listSearchEngines();
    expect(engines.length).toBeGreaterThan(5);
    for (const e of engines) {
      expect(e.id.length).toBeGreaterThan(0);
      expect(e.name.length).toBeGreaterThan(0);
      expect(e.notes.length).toBeGreaterThan(0);
    }
  });

  it("configured reflects actual env presence, not a hardcoded true/false", () => {
    const original = process.env.MOJEEK_API_KEY;
    delete process.env.MOJEEK_API_KEY;
    let engines = listSearchEngines();
    const mojeekOff = engines.find((e) => e.id === "mojeek");
    expect(mojeekOff?.configured).toBe(false);

    process.env.MOJEEK_API_KEY = "test-key";
    engines = listSearchEngines();
    const mojeekOn = engines.find((e) => e.id === "mojeek");
    expect(mojeekOn?.configured).toBe(true);

    if (original === undefined) delete process.env.MOJEEK_API_KEY;
    else process.env.MOJEEK_API_KEY = original;
  });
});

describe("liveSearch — honest failure paths, no fabricated results", () => {
  it("returns an ERROR status immediately for an empty query, with no network calls", async () => {
    const result = await liveSearch("   ");
    expect(result.status).toBe("ERROR");
    expect(result.results).toEqual([]);
  });

  it("never-configured engines fail gracefully without throwing or fabricating results", async () => {
    const result = await liveSearch("test query", { engines: ["startpage"] });
    expect(result.results).toEqual([]);
    expect(result.status).not.toBe("OK");
  });
});
