/** Shared search types — single source of truth */

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

export type SearchStatus = "OK" | "CONFIGURATION_REQUIRED" | "ERROR" | "UNAVAILABLE";

export interface SearchResponse {
  query: string;
  results: SearchHit[];
  engine: SearchEngineId | string;
  status: SearchStatus;
  note?: string;
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

export interface MultiSearchResult {
  query: string;
  byEngine: SearchResponse[];
  merged: SearchHit[];
  enginesConfigured: EngineDescriptor[];
  summary?: string;
}

export interface SearchAllResult extends MultiSearchResult {
  attempted: SearchEngineId[];
  summary: string;
}
