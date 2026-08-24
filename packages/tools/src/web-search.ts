/**
 * Multi-Engine Live Search Adapter — public API + tool registration
 */
export {
  liveSearch,
  searchWithEngine,
  multiEngineSearch,
  listSearchEngines,
  type SearchHit,
  type SearchResponse,
  type SearchEngineId,
  type EngineDescriptor,
} from "./search-connectors";
import {
  liveSearch,
  searchWithEngine,
  multiEngineSearch,
} from "./search-connectors";
import { registerTool } from "./registry";
import type { ToolResult } from "./types";
import type { SearchEngineId } from "./search-connectors";

registerTool({
  name: "web_search",
  description:
    "Search the public web via multi-engine adapter (Google/Bing/DDG/Brave/Yandex/Naver/Mojeek/Wolfram/…). Never invents sources.",
  permissions: ["web_search"],
  sensitive: false,
  async execute(input: Record<string, unknown>): Promise<ToolResult> {
    const query = String(input.query ?? "").trim();
    if (!query) return { success: false, error: "query is required" };
    const engine = input.engine ? (String(input.engine) as SearchEngineId) : undefined;
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
