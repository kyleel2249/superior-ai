import type { OpenApiSpec, OpenApiPathItem } from "./openapi-types";

const paths: Record<string, OpenApiPathItem> = {};
const tags = new Map<string, string>();

export function registerPath(path: string, item: OpenApiPathItem): void {
  paths[path] = { ...(paths[path] ?? {}), ...item };
}

export function registerTag(name: string, description: string): void {
  tags.set(name, description);
}

export function buildOpenApiSpec(baseUrl: string): OpenApiSpec {
  return {
    openapi: "3.0.3",
    info: {
      title: "SUPERIOR AI API",
      version: "0.1.0",
      description:
        "Generated OpenAPI spec for SUPERIOR AI's API surface. This covers routes that have been " +
        "individually tested against a live server (real request/response shapes confirmed, not " +
        "guessed from source alone) — it is not yet exhaustive coverage of every route in the app. " +
        "See /api/openapi's own description field for the current route count vs. total.",
    },
    servers: [{ url: baseUrl, description: "Current deployment" }],
    tags: [...tags.entries()].map(([name, description]) => ({ name, description })),
    paths,
  };
}
