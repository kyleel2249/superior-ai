import { describe, it, expect } from "vitest";
// Import the builder directly (not the package index/./routes) so this
// test's registrations stay isolated from the real app route registry's
// side-effecting imports.
import { registerPath, registerTag, buildOpenApiSpec } from "../builder";

function op(id: string) {
  return {
    summary: id,
    operationId: id,
    responses: { "200": { description: "OK" } },
  };
}

describe("registerPath", () => {
  it("registering GET then POST on the same path merges rather than overwrites", () => {
    const path = `/api/test-merge-${Math.random()}`;
    registerPath(path, { get: op("getTest") });
    registerPath(path, { post: op("postTest") });
    const spec = buildOpenApiSpec("https://example.com");
    expect(spec.paths[path]?.get?.operationId).toBe("getTest");
    expect(spec.paths[path]?.post?.operationId).toBe("postTest");
  });

  it("registering the same method twice on the same path replaces that method's operation", () => {
    const path = `/api/test-replace-${Math.random()}`;
    registerPath(path, { get: op("first") });
    registerPath(path, { get: op("second") });
    const spec = buildOpenApiSpec("https://example.com");
    expect(spec.paths[path]?.get?.operationId).toBe("second");
  });
});

describe("registerTag", () => {
  it("adds a tag with its description to the built spec", () => {
    const tagName = `test-tag-${Math.random()}`;
    registerTag(tagName, "A test tag");
    const spec = buildOpenApiSpec("https://example.com");
    expect(spec.tags.find((t) => t.name === tagName)?.description).toBe("A test tag");
  });
});

describe("buildOpenApiSpec", () => {
  it("produces a structurally valid OpenAPI 3.0 document", () => {
    const spec = buildOpenApiSpec("https://api.example.com");
    expect(spec.openapi).toBe("3.0.3");
    expect(spec.info.title.length).toBeGreaterThan(0);
    expect(spec.servers[0]?.url).toBe("https://api.example.com");
    expect(typeof spec.paths).toBe("object");
  });

  it("the info description honestly qualifies coverage as live-tested but not exhaustive", () => {
    const spec = buildOpenApiSpec("https://api.example.com");
    expect(spec.info.description).toMatch(/not yet exhaustive/i);
  });
});
