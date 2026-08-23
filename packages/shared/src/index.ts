export function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${x}`);
}

export function safeJsonParse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export * from "./crypto";
