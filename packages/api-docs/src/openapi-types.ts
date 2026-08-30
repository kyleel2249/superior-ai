/**
 * A pragmatic subset of the OpenAPI 3.0 spec — enough to produce a
 * genuinely valid, tool-consumable document (Swagger UI, Postman,
 * client generators) without modeling every corner of the full spec.
 */

export interface OpenApiSchema {
  type?: "object" | "array" | "string" | "number" | "integer" | "boolean" | "null";
  description?: string;
  properties?: Record<string, OpenApiSchema>;
  items?: OpenApiSchema;
  required?: string[];
  enum?: (string | number)[];
  example?: unknown;
  nullable?: boolean;
}

export interface OpenApiParameter {
  name: string;
  in: "query" | "path" | "header";
  required?: boolean;
  description?: string;
  schema: OpenApiSchema;
}

export interface OpenApiResponse {
  description: string;
  content?: Record<string, { schema: OpenApiSchema }>;
}

export interface OpenApiOperation {
  summary: string;
  description?: string;
  operationId: string;
  tags?: string[];
  parameters?: OpenApiParameter[];
  requestBody?: {
    required?: boolean;
    content: Record<string, { schema: OpenApiSchema }>;
  };
  responses: Record<string, OpenApiResponse>;
}

export interface OpenApiPathItem {
  get?: OpenApiOperation;
  post?: OpenApiOperation;
  put?: OpenApiOperation;
  delete?: OpenApiOperation;
}

export interface OpenApiSpec {
  openapi: "3.0.3";
  info: {
    title: string;
    version: string;
    description: string;
  };
  servers: { url: string; description?: string }[];
  tags: { name: string; description?: string }[];
  paths: Record<string, OpenApiPathItem>;
}
