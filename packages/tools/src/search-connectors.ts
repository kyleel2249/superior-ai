/**
 * packages/tools/src/web-search.ts already imported liveSearch,
 * searchWithEngine, multiEngineSearch, listSearchEngines, SearchHit,
 * SearchResponse, SearchEngineId, EngineDescriptor from "./search-connectors"
 * — didn't exist under any filename. Real HTTP calls for the engines with a
 * public/free API; engines that need a paid key you don't have configured
 * are listed (matching the commit's "Google/Bing/DDG/Brave/Yandex/Naver/
 * Mojeek/Wolfram" scope) but honestly report unconfigured rather than faking
 * results.
 */

export type SearchEngineId = "duckduckgo" | "brave" | "bing" | "google" | "wolfram" | "yandex" | "naver" | "mojeek";

export interface SearchHit {
  title: string;
  url: string;
  snippet?: string;
}

export interface SearchResponse {
  engine: SearchEngineId;
  query: string;
  status: "OK" | "UNCONFIGURED" | "ERROR";
  results: SearchHit[];
  message?: string;
}

export interface EngineDescriptor {
  id: SearchEngineId;
  configured: boolean;
}

const ENGINE_ENV: Record<SearchEngineId, string[]> = {
  duckduckgo: [],
  brave: ["BRAVE_API_KEY"],
  bing: ["AZURE_BING_KEY"],
  google: ["GOOGLE_CSE_ID", "GOOGLE_CSE_KEY"],
  wolfram: ["WOLFRAM_APP_ID"],
  yandex: ["YANDEX_API_KEY"],
  naver: ["NAVER_CLIENT_ID", "NAVER_CLIENT_SECRET"],
  mojeek: ["MOJEEK_API_KEY"],
};

function isConfigured(engine: SearchEngineId): boolean {
  const required = ENGINE_ENV[engine];
  return required.length === 0 || required.every((k) => Boolean(process.env[k]));
}

export function listSearchEngines(): EngineDescriptor[] {
  return (Object.keys(ENGINE_ENV) as SearchEngineId[]).map((id) => ({ id, configured: isConfigured(id) }));
}

async function searchDuckDuckGo(query: string): Promise<SearchResponse> {
  // DuckDuckGo's Instant Answer API needs no key but only returns a summary +
  // "related topics", not full web results — labeled honestly, not a full SERP.
  const res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
  if (!res.ok) return { engine: "duckduckgo", query, status: "ERROR", results: [], message: `HTTP ${res.status}` };
  const data = (await res.json()) as {
    AbstractText?: string;
    AbstractURL?: string;
    Heading?: string;
    RelatedTopics?: Array<{ Text?: string; FirstURL?: string }>;
  };
  const results: SearchHit[] = [];
  if (data.AbstractText && data.AbstractURL) {
    results.push({ title: data.Heading || query, url: data.AbstractURL, snippet: data.AbstractText });
  }
  for (const topic of data.RelatedTopics ?? []) {
    if (topic.FirstURL && topic.Text) results.push({ title: topic.Text.slice(0, 80), url: topic.FirstURL, snippet: topic.Text });
    if (results.length >= 10) break;
  }
  return { engine: "duckduckgo", query, status: "OK", results, message: results.length === 0 ? "DuckDuckGo Instant Answer had no summary/related topics for this query (it is not a full web index)." : undefined };
}

async function searchBrave(query: string): Promise<SearchResponse> {
  const key = process.env.BRAVE_API_KEY;
  if (!key) return { engine: "brave", query, status: "UNCONFIGURED", results: [], message: "BRAVE_API_KEY not set" };
  const res = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}`, {
    headers: { "X-Subscription-Token": key, Accept: "application/json" },
  });
  if (!res.ok) return { engine: "brave", query, status: "ERROR", results: [], message: `HTTP ${res.status}` };
  const data = (await res.json()) as { web?: { results?: Array<{ title: string; url: string; description?: string }> } };
  return { engine: "brave", query, status: "OK", results: (data.web?.results ?? []).map((r) => ({ title: r.title, url: r.url, snippet: r.description })) };
}

async function searchBing(query: string): Promise<SearchResponse> {
  const key = process.env.AZURE_BING_KEY;
  if (!key) return { engine: "bing", query, status: "UNCONFIGURED", results: [], message: "AZURE_BING_KEY not set" };
  const res = await fetch(`https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}`, {
    headers: { "Ocp-Apim-Subscription-Key": key },
  });
  if (!res.ok) return { engine: "bing", query, status: "ERROR", results: [], message: `HTTP ${res.status}` };
  const data = (await res.json()) as { webPages?: { value?: Array<{ name: string; url: string; snippet?: string }> } };
  return { engine: "bing", query, status: "OK", results: (data.webPages?.value ?? []).map((r) => ({ title: r.name, url: r.url, snippet: r.snippet })) };
}

async function searchGoogle(query: string): Promise<SearchResponse> {
  const cx = process.env.GOOGLE_CSE_ID;
  const key = process.env.GOOGLE_CSE_KEY;
  if (!cx || !key) return { engine: "google", query, status: "UNCONFIGURED", results: [], message: "GOOGLE_CSE_ID / GOOGLE_CSE_KEY not set" };
  const res = await fetch(`https://www.googleapis.com/customsearch/v1?key=${key}&cx=${cx}&q=${encodeURIComponent(query)}`);
  if (!res.ok) return { engine: "google", query, status: "ERROR", results: [], message: `HTTP ${res.status}` };
  const data = (await res.json()) as { items?: Array<{ title: string; link: string; snippet?: string }> };
  return { engine: "google", query, status: "OK", results: (data.items ?? []).map((r) => ({ title: r.title, url: r.link, snippet: r.snippet })) };
}

async function searchWolfram(query: string): Promise<SearchResponse> {
  const appId = process.env.WOLFRAM_APP_ID;
  if (!appId) return { engine: "wolfram", query, status: "UNCONFIGURED", results: [], message: "WOLFRAM_APP_ID not set" };
  const res = await fetch(`https://api.wolframalpha.com/v1/result?appid=${appId}&i=${encodeURIComponent(query)}`);
  const text = await res.text();
  if (!res.ok) return { engine: "wolfram", query, status: res.status === 501 ? "OK" : "ERROR", results: [], message: text.slice(0, 200) };
  return { engine: "wolfram", query, status: "OK", results: [{ title: "Wolfram Alpha result", url: `https://www.wolframalpha.com/input?i=${encodeURIComponent(query)}`, snippet: text }] };
}

async function searchUnconfigured(engine: SearchEngineId, query: string): Promise<SearchResponse> {
  return { engine, query, status: "UNCONFIGURED", results: [], message: `${engine} connector is not implemented yet.` };
}

export async function searchWithEngine(query: string, engine: SearchEngineId): Promise<SearchResponse> {
  switch (engine) {
    case "duckduckgo": return searchDuckDuckGo(query);
    case "brave": return searchBrave(query);
    case "bing": return searchBing(query);
    case "google": return searchGoogle(query);
    case "wolfram": return searchWolfram(query);
    default: return searchUnconfigured(engine, query);
  }
}

export async function liveSearch(query: string, opts: { prefer?: SearchEngineId; engines?: SearchEngineId[] } = {}): Promise<SearchResponse> {
  const order: SearchEngineId[] = opts.engines?.length
    ? opts.engines
    : opts.prefer
      ? [opts.prefer, ...listSearchEngines().map((e) => e.id).filter((id) => id !== opts.prefer)]
      : listSearchEngines().filter((e) => e.configured).map((e) => e.id).concat("duckduckgo");
  for (const engine of order) {
    const result = await searchWithEngine(query, engine);
    if (result.status === "OK" && result.results.length > 0) return result;
  }
  return searchDuckDuckGo(query);
}

export async function multiEngineSearch(query: string, engines?: SearchEngineId[]): Promise<{ merged: SearchHit[]; byEngine: SearchResponse[] }> {
  const targets = engines?.length ? engines : listSearchEngines().filter((e) => e.configured).map((e) => e.id);
  const byEngine = await Promise.all(targets.map((e) => searchWithEngine(query, e)));
  const seen = new Set<string>();
  const merged: SearchHit[] = [];
  for (const r of byEngine) {
    for (const hit of r.results) {
      if (seen.has(hit.url)) continue;
      seen.add(hit.url);
      merged.push(hit);
    }
  }
  return { merged, byEngine };
}
