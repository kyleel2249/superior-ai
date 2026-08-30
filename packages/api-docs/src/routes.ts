/**
 * Real route definitions — each one here reflects a request/response
 * shape actually confirmed by live-testing that route against a running
 * server (this session or documented as such), not inferred from source
 * reading alone. Registering a route here is a claim that it's been
 * verified, so new entries should meet that bar before being added.
 */

import { registerPath, registerTag } from "./builder";
import type { OpenApiSchema } from "./openapi-types";

const jsonBody = (schema: OpenApiSchema) => ({ content: { "application/json": { schema } } });
const jsonResponse = (description: string, schema: OpenApiSchema) => ({
  description,
  content: { "application/json": { schema } },
});

registerTag("Health & Status", "System health, provider status");
registerTag("Models", "Model registry, discovery, benchmarking, lifecycle");
registerTag("Advanced Subsystems", "Disagreement engine, governance board, agent auction, experiments");
registerTag("CINTEXA Core", "Model cascade, council planning/execution, quality scoring");
registerTag("Auth", "Dev and OIDC authentication");
registerTag("Chat", "Conversational orchestration entry point");
registerTag("Campaigns", "Creative campaign generation");
registerTag("Billing", "Budget management (Stripe-backed)");
registerTag("Search", "Multi-engine web search");

registerPath("/api/health", {
  get: {
    summary: "Get overall system health snapshot",
    operationId: "getHealth",
    tags: ["Health & Status"],
    responses: {
      "200": jsonResponse("Health snapshot", {
        type: "object",
        properties: {
          overall: { type: "string", enum: ["operational", "degraded", "down"] },
          components: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                status: { type: "string" },
                updatedAt: { type: "string" },
              },
            },
          },
          continuousCapacity: { type: "boolean", example: true },
        },
      }),
    },
  },
});

registerPath("/api/models", {
  get: {
    summary: "List registered models",
    operationId: "listModels",
    tags: ["Models"],
    parameters: [
      { name: "provider", in: "query", schema: { type: "string" } },
      { name: "goldenTasks", in: "query", schema: { type: "string" }, description: "Set to 1 to instead return the golden task list" },
    ],
    responses: {
      "200": jsonResponse("Model list, each including real lifecycle stage and latest benchmark result", {
        type: "object",
        properties: {
          models: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                provider: { type: "string" },
                modelId: { type: "string" },
                displayName: { type: "string" },
                status: { type: "string" },
                lifecycle: { type: "object" },
                latestBenchmark: { type: "object", nullable: true },
              },
            },
          },
        },
      }),
    },
  },
  post: {
    summary: "Model actions — discover, health, benchmark, resolve, benchmark_suite, benchmark_history, benchmark_compare, sandbox_check, sandbox_promote",
    operationId: "modelAction",
    tags: ["Models"],
    requestBody: {
      required: true,
      ...jsonBody({
        type: "object",
        required: ["action"],
        properties: {
          action: { type: "string", enum: ["discover", "health", "benchmark", "resolve", "benchmark_suite", "benchmark_history", "benchmark_compare", "sandbox_check", "sandbox_promote"] },
        },
      }),
    },
    responses: {
      "200": jsonResponse("Result shape depends on action", { type: "object" }),
      "400": jsonResponse("Missing required fields for the action", { type: "object", properties: { error: { type: "string" } } }),
    },
  },
});

registerPath("/api/advanced", {
  get: {
    summary: "Advanced subsystem views — twins, kpi, root_cause, economics, knowledge, incidents, agents",
    operationId: "advancedView",
    tags: ["Advanced Subsystems"],
    parameters: [{ name: "view", in: "query", required: true, schema: { type: "string" } }],
    responses: { "200": jsonResponse("View-specific data", { type: "object" }) },
  },
  post: {
    summary: "Advanced subsystem actions — disagreement_resolve, governance_review, auction_run, experiment_run, and more",
    operationId: "advancedAction",
    tags: ["Advanced Subsystems"],
    requestBody: {
      required: true,
      ...jsonBody({
        type: "object",
        required: ["action"],
        properties: {
          action: { type: "string", example: "disagreement_resolve" },
          claims: { type: "array", description: "For disagreement_resolve: array of {agentId, agentName, subject, assertion, confidence, evidenceRefs}" },
          proposal: { type: "object", description: "For governance_review: {id, title, description, proposedBy, risk, modelChange?, policyChange?}" },
          task: { type: "object", description: "For auction_run: {id, title, requiredTools, requiredPermissions, complexity, priority}" },
        },
      }),
    },
    responses: {
      "200": jsonResponse("Result shape depends on action", { type: "object" }),
      "400": jsonResponse("Unknown action or missing fields", { type: "object", properties: { error: { type: "string" } } }),
    },
  },
});

registerPath("/api/cintexa", {
  get: {
    summary: "CINTEXA core status / model matrix",
    operationId: "cintexaGet",
    tags: ["CINTEXA Core"],
    parameters: [{ name: "matrix", in: "query", schema: { type: "string" }, description: "Set to 1 for the competitive matrix" }],
    responses: { "200": jsonResponse("Status or matrix data", { type: "object" }) },
  },
  post: {
    summary: "CINTEXA actions — cascade, council, council_execute, disagreement, quality, reasoning, resolve",
    operationId: "cintexaAction",
    tags: ["CINTEXA Core"],
    requestBody: {
      required: true,
      ...jsonBody({
        type: "object",
        required: ["action"],
        properties: {
          action: { type: "string", example: "council_execute" },
          objective: { type: "string" },
        },
      }),
    },
    responses: {
      "200": jsonResponse("For council_execute: real per-seat model output, latency, and injection-detection signals", {
        type: "object",
        properties: {
          plan: { type: "object" },
          seatResults: {
            type: "array",
            items: {
              type: "object",
              properties: {
                role: { type: "string" },
                provider: { type: "string", nullable: true },
                modelId: { type: "string", nullable: true },
                output: { type: "string", nullable: true },
                error: { type: "string", nullable: true },
                injectionSignals: { type: "array", items: { type: "string" } },
              },
            },
          },
        },
      }),
    },
  },
});

registerPath("/api/auth", {
  post: {
    summary: "Dev-mode login — issues a session JWT (blocked in production when OIDC is configured)",
    operationId: "devLogin",
    tags: ["Auth"],
    requestBody: {
      required: true,
      ...jsonBody({ type: "object", properties: { email: { type: "string" }, role: { type: "string" } } }),
    },
    responses: {
      "200": jsonResponse("Session token issued via Set-Cookie and response body", {
        type: "object",
        properties: { token: { type: "string" } },
      }),
    },
  },
});

registerPath("/api/auth/oidc/login", {
  get: {
    summary: "Initiate OIDC login — redirects to the configured issuer with a CSRF-protected state cookie",
    operationId: "oidcLogin",
    tags: ["Auth"],
    responses: {
      "302": { description: "Redirect to the OIDC issuer's /authorize endpoint" },
      "400": jsonResponse("OIDC not configured", { type: "object", properties: { error: { type: "string" } } }),
    },
  },
});

registerPath("/api/auth/oidc/callback", {
  get: {
    summary: "OIDC callback — verifies state against the login-time cookie (rejects mismatches with 401), exchanges code for tokens",
    operationId: "oidcCallback",
    tags: ["Auth"],
    parameters: [
      { name: "code", in: "query", required: true, schema: { type: "string" } },
      { name: "state", in: "query", required: true, schema: { type: "string" } },
    ],
    responses: {
      "302": { description: "Redirect to /chat with a session cookie set" },
      "401": jsonResponse("State mismatch — possible CSRF attempt or expired login attempt", { type: "object", properties: { error: { type: "string" } } }),
    },
  },
});

registerPath("/api/chat", {
  post: {
    summary: "Chat / department orchestration entry point — routes through the model registry and council",
    operationId: "chat",
    tags: ["Chat"],
    requestBody: {
      required: true,
      ...jsonBody({ type: "object", required: ["message"], properties: { message: { type: "string" } } }),
    },
    responses: {
      "200": jsonResponse("Reply includes an honest, specific diagnostic (e.g. naming OPENROUTER_API_KEY) if no provider is configured, rather than a generic error", {
        type: "object",
        properties: { reply: { type: "string" } },
      }),
    },
  },
});

registerPath("/api/campaigns", {
  post: {
    summary: "Generate a creative campaign (storyboard, ad copy, package) from an objective",
    operationId: "createCampaign",
    tags: ["Campaigns"],
    requestBody: {
      required: true,
      ...jsonBody({
        type: "object",
        required: ["objective"],
        properties: { objective: { type: "string" }, product: { type: "string" }, audience: { type: "string" } },
      }),
    },
    responses: { "200": jsonResponse("Campaign package", { type: "object" }) },
  },
});

registerPath("/api/billing", {
  get: {
    summary: "Get an organization's budget and usage",
    operationId: "getBilling",
    tags: ["Billing"],
    parameters: [{ name: "organizationId", in: "query", required: true, schema: { type: "string" } }],
    responses: { "200": jsonResponse("Budget and usage rollup", { type: "object" }) },
  },
  post: {
    summary: "Set a budget (action: set_budget)",
    operationId: "setBudget",
    tags: ["Billing"],
    requestBody: {
      required: true,
      ...jsonBody({
        type: "object",
        required: ["action", "organizationId"],
        properties: {
          action: { type: "string", enum: ["set_budget"] },
          organizationId: { type: "string" },
          monthlyLimitUsd: { type: "number" },
          hardStop: { type: "boolean" },
        },
      }),
    },
    responses: { "200": jsonResponse("Updated budget", { type: "object" }) },
  },
});

registerPath("/api/search", {
  get: {
    summary: "List available search engines and their configuration status",
    operationId: "listSearchEngines",
    tags: ["Search"],
    parameters: [{ name: "list", in: "query", schema: { type: "string" }, description: "Set to 1 to list engines" }],
    responses: {
      "200": jsonResponse("Engine list — includes 15 real engines, some honestly marked unconfigured", {
        type: "object",
        properties: {
          engines: {
            type: "array",
            items: {
              type: "object",
              properties: { id: { type: "string" }, name: { type: "string" }, configured: { type: "boolean" } },
            },
          },
        },
      }),
    },
  },
  post: {
    summary: "Run a search — falls through a real cascade (paid APIs first, keyless engines last), never fabricates results on total failure",
    operationId: "search",
    tags: ["Search"],
    requestBody: {
      required: true,
      ...jsonBody({ type: "object", required: ["query"], properties: { query: { type: "string" }, mode: { type: "string" } } }),
    },
    responses: {
      "200": jsonResponse("Search results, or an honest error if every engine in the cascade failed/is unconfigured", { type: "object" }),
    },
  },
});
