/**
 * Multi-Engine Live Search Adapter
 *
 * Official / documented connectors when keys exist.
 * Keyless fallbacks only where public endpoints are intentionally usable.
 * Never invents sources or result lists.
 *
 * Engine map:
 *  Google      → Serper or Google Custom Search (CSE)
 *  Bing        → Bing Web Search API v7
 *  Yahoo       → Bing-backed (same Bing API; labeled yahoo_via_bing)
 *  DuckDuckGo  → Instant Answer API + HTML fallback
 *  Brave       → Brave Search API
 *  Startpage   → CONFIGURATION_REQUIRED (no public API)
 *  Baidu       → CONFIGURATION_REQUIRED (partner API only)
 *  Yandex      → Yandex XML / Cloud Search (when key set)
 *  Naver       → Naver Search API (when client id/secret set)
 *  Ecosia      → Bing-backed public web (no dedicated API; via Bing if keyed)
 *  Mojeek      → Mojeek Search API
 *  WolframAlpha→ Computational knowledge API (not web SERP)
 */

import { registerTool } from "./registry";
import type { ToolResult } from "./types";

export interface SearchHit {
  title: string;
  url: string;
  snippet: string;
  engine?: string;
}

export type SearchEngineId =
  | "google_serper"
  | "google_cse"
  | "bing"
  | "yahoo_via_bing"
  | "duckduckgo"
  | "duckduckgo_html"
  | "brave"
  | "startpage"
  | "baidu"
  | "yandex"
  | "naver"
  | "ecosia_via_bing"
  | "mojeek"
  | "wolframalpha"
  | "tavily"
  | "none";

export interface SearchResponse {
  query: string;
  results: SearchHit[];
  engine: SearchEngineId | string;
  status: "OK" | "CONFIGURATION_REQUIRED" | "ERROR" | "UNAVAILABLE";
  note?: string;
  /** Computational answer (Wolfram) when applicable */
  answer?: string;
}

export interface EngineDescriptor {
  id: SearchEngineId;
  name: string;
  category: "global" | "privacy" | "regional" | "alternative" | "computational" | "meta";
  requiresKeys: string[];
  configured: boolean;
  notes: string;
}

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}

/** Catalog of supported engines for admin / status UI */
export function listSearchEngines(): EngineDescriptor[] {
  return [
    {
      id: "google_serper",
      name: "Google (via Serper)",
      category: "global",
      requiresKeys: ["SERPER_API_KEY"],
      configured: Boolean(env("SERPER_API_KEY")),
      notes: "Google-quality SERP through Serper API.",
    },
    {
      id: "google_cse",
      name: "Google Custom Search",
      category: "global",
      requiresKeys: ["GOOGLE_CSE_API_KEY", "GOOGLE_CSE_CX"],
      configured: Boolean(env("GOOGLE_CSE_API_KEY") && env("GOOGLE_CSE_CX")),
      notes: "Official Google Programmable Search Engine.",
    },
    {
      id: "bing",
      name: "Bing",
      category: "global",
      requiresKeys: ["BING_SEARCH_API_KEY"],
      configured: Boolean(env("BING_SEARCH_API_KEY")),
      notes: "Microsoft Bing Web Search API v7.",
    },
    {
      id: "yahoo_via_bing",
      name: "Yahoo (Bing-powered)",
      category: "global",
      requiresKeys: ["BING_SEARCH_API_KEY"],
      configured: Boolean(env("BING_SEARCH_API_KEY")),
      notes: "Yahoo search is powered by Bing; results use Bing API and are labeled accordingly.",
    },
    {
      id: "duckduckgo",
      name: "DuckDuckGo",
      category: "privacy",
      requiresKeys: [],
      configured: true,
      notes: "Instant Answer API + HTML fallback. No tracking by design.",
    },
    {
      id: "brave",
      name: "Brave Search",
      category: "privacy",
      requiresKeys: ["BRAVE_SEARCH_API_KEY"],
      configured: Boolean(env("BRAVE_SEARCH_API_KEY")),
      notes: "Independent index; requires Brave Search API key.",
    },
    {
      id: "startpage",
      name: "Startpage",
      category: "privacy",
      requiresKeys: ["STARTPAGE_API_KEY"],
      configured: Boolean(env("STARTPAGE_API_KEY")),
      notes: "No public general API. Marked UNAVAILABLE unless partner key provided.",
    },
    {
      id: "baidu",
      name: "Baidu",
      category: "regional",
      requiresKeys: ["BAIDU_SEARCH_API_KEY"],
      configured: Boolean(env("BAIDU_SEARCH_API_KEY")),
      notes: "China-dominant engine. Official partner API required — no scrape bypass.",
    },
    {
      id: "yandex",
      name: "Yandex",
      category: "regional",
      requiresKeys: ["YANDEX_SEARCH_API_KEY", "YANDEX_FOLDER_ID"],
      configured: Boolean(env("YANDEX_SEARCH_API_KEY")),
      notes: "Russia / CIS primary engine. Cloud Search or XML API when configured.",
    },
    {
      id: "naver",
      name: "Naver",
      category: "regional",
      requiresKeys: ["NAVER_CLIENT_ID", "NAVER_CLIENT_SECRET"],
      configured: Boolean(env("NAVER_CLIENT_ID") && env("NAVER_CLIENT_SECRET")),
      notes: "Korea portal search. Official Open API.",
    },
    {
      id: "ecosia_via_bing",
      name: "Ecosia (Bing-powered)",
      category: "alternative",
      requiresKeys: ["BING_SEARCH_API_KEY"],
      configured: Boolean(env("BING_SEARCH_API_KEY")),
      notes: "Ecosia uses Bing under the hood; we label results ecosia_via_bing when requested.",
    },
    {
      id: "mojeek",
      name: "Mojeek",
      category: "alternative",
      requiresKeys: ["MOJEEK_API_KEY"],
      configured: Boolean(env("MOJEEK_API_KEY")),
      notes: "Independent crawler. API key required.",
    },
    {
      id: "wolframalpha",
      name: "Wolfram|Alpha",
      category: "computational",
      requiresKeys: ["WOLFRAM_APP_ID"],
      configured: Boolean(env("WOLFRAM_APP_ID")),
      notes: "Computes answers; not a web page index.",
    },
    {
      id: "tavily",
      name: "Tavily (research meta)",
      category: "meta",
      requiresKeys: ["TAVILY_API_KEY"],
      configured: Boolean(env("TAVILY_API_KEY")),
      notes: "Research-oriented search API used by agents.",
    },
  ];
}

async function searchSerper(query: string, apiKey: string): Promise<SearchResponse> {
  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ q: query, num: 10 }),
  });
  if (!res.ok) throw new Error(`Serper HTTP ${res.status}`);
  const data = await res.json();
  const results: SearchHit[] = (data.organic ?? []).map(
    (r: { title?: string; link?: string; snippet?: string }) => ({
      title: r.title ?? "",
      url: r.link ?? "",
      snippet: r.snippet ?? "",
      engine: "google_serper",
    })
  );
  return { query, results, engine: "google_serper", status: "OK" };
}

async function searchGoogleCse(query: string, apiKey: string, cx: string): Promise<SearchResponse> {
  const url = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(apiKey)}&cx=${encodeURIComponent(cx)}&q=${encodeURIComponent(query)}&num=10`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Google CSE HTTP ${res.status}`);
  const data = await res.json();
  const results: SearchHit[] = (data.items ?? []).map(
    (r: { title?: string; link?: string; snippet?: string }) => ({
      title: r.title ?? "",
      url: r.link ?? "",
      snippet: r.snippet ?? "",
      engine: "google_cse",
    })
  );
  return { query, results, engine: "google_cse", status: "OK" };
}

async function searchBing(
  query: string,
  apiKey: string,
  label: SearchEngineId = "bing"
): Promise<SearchResponse> {
  const res = await fetch(
    `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}&count=10`,
    { headers: { "Ocp-Apim-Subscription-Key": apiKey } }
  );
  if (!res.ok) throw new Error(`Bing HTTP ${res.status}`);
  const data = await res.json();
  const results: SearchHit[] = (data.webPages?.value ?? []).map(
    (r: { name?: string; url?: string; snippet?: string }) => ({
      title: r.name ?? "",
      url: r.url ?? "",
      snippet: r.snippet ?? "",
      engine: label,
    })
  );
  return {
    query,
    results,
    engine: label,
    status: "OK",
    note:
      label === "yahoo_via_bing"
        ? "Yahoo Search is powered by Bing; results from Bing Web Search API."
        : label === "ecosia_via_bing"
          ? "Ecosia is Bing-powered; results from Bing API labeled for Ecosia requests."
          : undefined,
  };
}

async function searchTavily(query: string, apiKey: string): Promise<SearchResponse> {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      max_results: 10,
      include_answer: false,
    }),
  });
  if (!res.ok) throw new Error(`Tavily HTTP ${res.status}`);
  const data = await res.json();
  const results: SearchHit[] = (data.results ?? []).map(
    (r: { title?: string; url?: string; content?: string }) => ({
      title: r.title ?? "",
      url: r.url ?? "",
      snippet: (r.content ?? "").slice(0, 400),
      engine: "tavily",
    })
  );
  return { query, results, engine: "tavily", status: "OK" };
}

async function searchBrave(query: string, apiKey: string): Promise<SearchResponse> {
  const res = await fetch(
    `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=10`,
    {
      headers: {
        Accept: "application/json",
        "X-Subscription-Token": apiKey,
      },
    }
  );
  if (!res.ok) throw new Error(`Brave HTTP ${res.status}`);
  const data = await res.json();
  const results: SearchHit[] = (data.web?.results ?? []).map(
    (r: { title?: string; url?: string; description?: string }) => ({
      title: r.title ?? "",
      url: r.url ?? "",
      snippet: r.description ?? "",
      engine: "brave",
    })
  );
  return { query, results, engine: "brave", status: "OK" };
}

async function searchMojeek(query: string, apiKey: string): Promise<SearchResponse> {
  const res = await fetch(
    `https://api.mojeek.com/search?q=${encodeURIComponent(query)}&api_key=${encodeURIComponent(apiKey)}&fmt=json`,
    { headers: { Accept: "application/json" } }
  );
  if (!res.ok) throw new Error(`Mojeek HTTP ${res.status}`);
  const data = await res.json();
  const results: SearchHit[] = (data.response?.results ?? data.results ?? []).map(
    (r: { title?: string; url?: string; desc?: string; description?: string }) => ({
      title: r.title ?? "",
      url: r.url ?? "",
      snippet: r.desc ?? r.description ?? "",
      engine: "mojeek",
    })
  );
  return { query, results, engine: "mojeek", status: "OK" };
}

async function searchNaver(
  query: string,
  clientId: string,
  clientSecret: string
): Promise<SearchResponse> {
  const res = await fetch(
    `https://openapi.naver.com/v1/search/webkr.json?query=${encodeURIComponent(query)}&display=10`,
    {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
    }
  );
  if (!res.ok) throw new Error(`Naver HTTP ${res.status}`);
  const data = await res.json();
  const results: SearchHit[] = (data.items ?? []).map(
    (r: { title?: string; link?: string; description?: string }) => ({
      title: (r.title ?? "").replace(/<[^>]+>/g, ""),
      url: r.link ?? "",
      snippet: (r.description ?? "").replace(/<[^>]+>/g, ""),
      engine: "naver",
    })
  );
  return { query, results, engine: "naver", status: "OK" };
}

async function searchYandex(query: string, apiKey: string, folderId?: string): Promise<SearchResponse> {
  // Yandex Cloud Search API (folder + API key). Falls back to clear CONFIGURATION note on failure.
  const body: Record<string, unknown> = {
    query: { searchType: "SEARCH_TYPE_WEB", queryText: query },
    groupSpec: { groupsOnPage: 10 },
  };
  if (folderId) body.folderId = folderId;
  const res = await fetch("https://searchapi.api.cloud.yandex.net/v2/web/search", {
    method: "POST",
    headers: {
      Authorization: `Api-Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Yandex HTTP ${res.status}`);
  const data = await res.json();
  // Response shape varies; extract best-effort
  const raw =
    data.results ??
    data.documents ??
    data.groups?.flatMap((g: { documents?: unknown[] }) => g.documents ?? []) ??
    [];
  const results: SearchHit[] = (Array.isArray(raw) ? raw : []).map(
    (r: { title?: string; url?: string; snippet?: string; text?: string }) => ({
      title: r.title ?? "",
      url: r.url ?? "",
      snippet: r.snippet ?? r.text ?? "",
      engine: "yandex",
    })
  );
  return { query, results, engine: "yandex", status: "OK" };
}

async function searchWolfram(query: string, appId: string): Promise<SearchResponse> {
  const url = `https://api.wolframalpha.com/v2/query?input=${encodeURIComponent(query)}&appid=${encodeURIComponent(appId)}&output=JSON`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Wolfram HTTP ${res.status}`);
  const data = await res.json();
  const pods = data.queryresult?.pods ?? [];
  const texts: string[] = [];
  for (const pod of pods) {
    for (const sub of pod.subpods ?? []) {
      if (sub.plaintext) texts.push(String(sub.plaintext));
    }
  }
  const answer = texts.slice(0, 6).join("\n\n");
  const results: SearchHit[] = answer
    ? [
        {
          title: "Wolfram|Alpha",
          url: `https://www.wolframalpha.com/input?i=${encodeURIComponent(query)}`,
          snippet: answer.slice(0, 500),
          engine: "wolframalpha",
        },
      ]
    : [];
  return {
    query,
    results,
    engine: "wolframalpha",
    status: results.length ? "OK" : "ERROR",
    answer: answer || undefined,
    note: "Computational knowledge — not a web SERP index.",
  };
}

/** DuckDuckGo Instant Answer API (no key) */
async function searchDuckDuckGoIA(query: string): Promise<SearchResponse> {
  const res = await fetch(
    `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
    {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    }
  );
  if (!res.ok) throw new Error(`DDG IA HTTP ${res.status}`);
  const data = await res.json();
  const results: SearchHit[] = [];
  if (data.AbstractText && data.AbstractURL) {
    results.push({
      title: data.Heading || "DuckDuckGo Abstract",
      url: data.AbstractURL,
      snippet: data.AbstractText,
      engine: "duckduckgo",
    });
  }
  for (const t of data.RelatedTopics ?? []) {
    if (t.FirstURL && t.Text) {
      results.push({
        title: t.Text.split(" - ")[0] || t.Text.slice(0, 80),
        url: t.FirstURL,
        snippet: t.Text,
        engine: "duckduckgo",
      });
    }
    for (const topic of t.Topics ?? []) {
      if (topic.FirstURL && topic.Text) {
        results.push({
          title: topic.Text.split(" - ")[0] || topic.Text.slice(0, 80),
          url: topic.FirstURL,
          snippet: topic.Text,
          engine: "duckduckgo",
        });
      }
    }
  }
  return {
    query,
    results: results.slice(0, 10),
    engine: "duckduckgo",
    status: results.length ? "OK" : "ERROR",
    note: results.length ? undefined : "Instant Answer empty; try HTML fallback.",
  };
}

async function searchDuckDuckGoHtml(query: string): Promise<SearchResponse> {
  const res = await fetch(
    `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
    {
      headers: {
        "User-Agent":
          "SUPERIOR-AI-ResearchBot/0.1 (+research; respectful; contact via repo)",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(12000),
    }
  );
  if (!res.ok) throw new Error(`DuckDuckGo HTML HTTP ${res.status}`);
  const html = await res.text();
  const results: SearchHit[] = [];
  const linkRe =
    /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  const snippetRe = /class="result__snippet[^"]*"[^>]*>([\s\S]*?)<\/(?:a|td|div)/gi;
  const links: Array<{ url: string; title: string }> = [];
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(html)) !== null && links.length < 10) {
    let url = m[1];
    const uddg = url.match(/uddg=([^&]+)/);
    if (uddg) {
      try {
        url = decodeURIComponent(uddg[1]);
      } catch {
        /* keep */
      }
    }
    const title = m[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (url.startsWith("http") && title) links.push({ url, title });
  }
  const snippets: string[] = [];
  while ((m = snippetRe.exec(html)) !== null && snippets.length < 10) {
    snippets.push(m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim());
  }
  for (let i = 0; i < links.length; i++) {
    results.push({
      title: links[i].title,
      url: links[i].url,
      snippet: snippets[i] ?? "",
      engine: "duckduckgo_html",
    });
  }
  return {
    query,
    results,
    engine: "duckduckgo_html",
    status: results.length ? "OK" : "ERROR",
    note: results.length
      ? "Live results via DuckDuckGo HTML (no API key)."
      : "DuckDuckGo HTML returned no parseable results.",
  };
}

function unavailable(
  query: string,
  engine: SearchEngineId,
  reason: string
): SearchResponse {
  return {
    query,
    results: [],
    engine,
    status: "CONFIGURATION_REQUIRED",
    note: reason,
  };
}

/**
 * Run a specific engine by id. Used for multi-engine fan-out and admin tests.
 */
export async function searchWithEngine(
  query: string,
  engine: SearchEngineId | string
): Promise<SearchResponse> {
  const q = query.trim();
  if (!q) {
    return { query: "", results: [], engine: "none", status: "ERROR", note: "query required" };
  }

  switch (engine) {
    case "google_serper": {
      const k = env("SERPER_API_KEY");
      if (!k) return unavailable(q, "google_serper", "Set SERPER_API_KEY");
      return searchSerper(q, k);
    }
    case "google_cse": {
      const k = env("GOOGLE_CSE_API_KEY");
      const cx = env("GOOGLE_CSE_CX");
      if (!k || !cx) return unavailable(q, "google_cse", "Set GOOGLE_CSE_API_KEY and GOOGLE_CSE_CX");
      return searchGoogleCse(q, k, cx);
    }
    case "bing": {
      const k = env("BING_SEARCH_API_KEY");
      if (!k) return unavailable(q, "bing", "Set BING_SEARCH_API_KEY");
      return searchBing(q, k, "bing");
    }
    case "yahoo_via_bing": {
      const k = env("BING_SEARCH_API_KEY");
      if (!k) return unavailable(q, "yahoo_via_bing", "Yahoo is Bing-powered; set BING_SEARCH_API_KEY");
      return searchBing(q, k, "yahoo_via_bing");
    }
    case "ecosia_via_bing": {
      const k = env("BING_SEARCH_API_KEY");
      if (!k) return unavailable(q, "ecosia_via_bing", "Ecosia is Bing-powered; set BING_SEARCH_API_KEY");
      return searchBing(q, k, "ecosia_via_bing");
    }
    case "brave": {
      const k = env("BRAVE_SEARCH_API_KEY");
      if (!k) return unavailable(q, "brave", "Set BRAVE_SEARCH_API_KEY");
      return searchBrave(q, k);
    }
    case "mojeek": {
      const k = env("MOJEEK_API_KEY");
      if (!k) return unavailable(q, "mojeek", "Set MOJEEK_API_KEY");
      return searchMojeek(q, k);
    }
    case "naver": {
      const id = env("NAVER_CLIENT_ID");
      const secret = env("NAVER_CLIENT_SECRET");
      if (!id || !secret) return unavailable(q, "naver", "Set NAVER_CLIENT_ID and NAVER_CLIENT_SECRET");
      return searchNaver(q, id, secret);
    }
    case "yandex": {
      const k = env("YANDEX_SEARCH_API_KEY");
      if (!k) return unavailable(q, "yandex", "Set YANDEX_SEARCH_API_KEY (and optional YANDEX_FOLDER_ID)");
      return searchYandex(q, k, env("YANDEX_FOLDER_ID"));
    }
    case "wolframalpha": {
      const k = env("WOLFRAM_APP_ID");
      if (!k) return unavailable(q, "wolframalpha", "Set WOLFRAM_APP_ID");
      return searchWolfram(q, k);
    }
    case "tavily": {
      const k = env("TAVILY_API_KEY");
      if (!k) return unavailable(q, "tavily", "Set TAVILY_API_KEY");
      return searchTavily(q, k);
    }
    case "duckduckgo":
    case "duckduckgo_html": {
      try {
        const ia = await searchDuckDuckGoIA(q);
        if (ia.results.length) return ia;
      } catch {
        /* fall through */
      }
      return searchDuckDuckGoHtml(q);
    }
    case "startpage":
      return unavailable(
        q,
        "startpage",
        "Startpage has no public general search API. Partner/connector required — no scrape bypass."
      );
    case "baidu":
      return unavailable(
        q,
        "baidu",
        "Baidu requires an official partner/search API. Scrape bypass is not implemented."
      );
    default:
      return unavailable(q, "none", `Unknown engine: ${engine}`);
  }
}

/**
 * Default cascade for agent research.
 * Prefer configured paid/official APIs, then privacy keyless DDG.
 */
export async function liveSearch(
  query: string,
  opts?: { engines?: SearchEngineId[]; prefer?: SearchEngineId }
): Promise<SearchResponse> {
  const q = query.trim();
  if (!q) {
    return { query: "", results: [], engine: "none", status: "ERROR", note: "query is required" };
  }

  const cascade: SearchEngineId[] = opts?.engines?.length
    ? opts.engines
    : [
        "google_serper",
        "google_cse",
        "bing",
        "brave",
        "tavily",
        "mojeek",
        "yandex",
        "naver",
        "duckduckgo",
      ];

  if (opts?.prefer) {
    const rest = cascade.filter((e) => e !== opts.prefer);
    cascade.splice(0, cascade.length, opts.prefer, ...rest);
  }

  const errors: string[] = [];
  for (const engine of cascade) {
    try {
      const out = await searchWithEngine(q, engine);
      if (out.results.length > 0 && (out.status === "OK" || out.status === "ERROR")) {
        // ERROR with results still useful (e.g. partial)
        if (out.results.length) return { ...out, status: "OK" };
      }
      if (out.status === "CONFIGURATION_REQUIRED" || out.status === "UNAVAILABLE") {
        errors.push(`${engine}: not configured`);
        continue;
      }
      if (out.status === "ERROR") {
        errors.push(`${engine}: ${out.note ?? "error"}`);
        continue;
      }
    } catch (e) {
      errors.push(`${engine}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // Last-resort HTML DDG if not already tried
  if (!cascade.includes("duckduckgo") && !cascade.includes("duckduckgo_html")) {
    try {
      const ddg = await searchDuckDuckGoHtml(q);
      if (ddg.results.length) return ddg;
    } catch (e) {
      errors.push(`duckduckgo_html: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return {
    query: q,
    results: [],
    engine: "none",
    status: "CONFIGURATION_REQUIRED",
    note: `No live results. Engines tried: ${cascade.join(", ")}. Details: ${errors.slice(0, 8).join("; ") || "none"}. Configure keys in .env (see listSearchEngines). Do not invent sources.`,
  };
}

/**
 * Fan-out search across multiple engines (parallel), merge by URL.
 */
export async function multiEngineSearch(
  query: string,
  engines?: SearchEngineId[]
): Promise<{
  query: string;
  byEngine: SearchResponse[];
  merged: SearchHit[];
  enginesConfigured: EngineDescriptor[];
}> {
  const catalog = listSearchEngines();
  const targets =
    engines ??
    (catalog.filter((e) => e.configured).map((e) => e.id) as SearchEngineId[]);
  const unique = [...new Set(targets.length ? targets : (["duckduckgo"] as SearchEngineId[]))];

  const byEngine = await Promise.all(unique.map((e) => searchWithEngine(query, e)));
  const seen = new Set<string>();
  const merged: SearchHit[] = [];
  for (const resp of byEngine) {
    for (const hit of resp.results) {
      const key = hit.url.replace(/#.*$/, "").toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      merged.push(hit);
    }
  }
  return { query, byEngine, merged, enginesConfigured: catalog };
}

registerTool({
  name: "web_search",
  description:
    "Search the public web via multi-engine adapter (Google/Bing/DDG/Brave/Yandex/Naver/Mojeek/Wolfram/…). Never invents sources.",
  permissions: ["web_search"],
  sensitive: false,
  async execute(input): Promise<ToolResult> {
    const query = String(input.query ?? "").trim();
    if (!query) return { success: false, error: "query is required" };
    const engine = input.engine ? String(input.engine) : undefined;
    const multi = input.multi === true || input.multi === "true";
    try {
      if (multi) {
        const data = await multiEngineSearch(
          query,
          Array.isArray(input.engines) ? (input.engines as SearchEngineId[]) : undefined
        );
        return {
          success: data.merged.length > 0,
          provenance: data.merged.length ? "Observed Data" : "Model Inference",
          data,
        };
      }
      const data = engine
        ? await searchWithEngine(query, engine)
        : await liveSearch(query, {
            prefer: input.prefer ? (String(input.prefer) as SearchEngineId) : undefined,
          });
      return {
        success: data.status === "OK" || data.results.length > 0,
        provenance: data.results.length ? "Observed Data" : "Model Inference",
        data,
      };
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : String(e),
        provenance: "Observed Data",
      };
    }
  },
});
