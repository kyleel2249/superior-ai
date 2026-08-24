/**
 * Phase 1 foundation gap: nothing in the repo had object storage before this.
 * Local filesystem backend is the default and is fully tested (see the repo's
 * verification run for this package). S3-compatible backend activates when
 * AWS_S3_BUCKET is set — written against @aws-sdk/client-s3's documented API
 * but not verified against a live bucket in this environment (no AWS
 * credentials or network path to S3 here). Same honesty rule as
 * packages/cache and packages/memory/src/postgres.ts: real code, unverified
 * integration, verify before depending on it in production.
 */
import { mkdir, writeFile, readFile, unlink, readdir, stat } from "fs/promises";
import { join, dirname } from "path";

export interface StorageObject {
  key: string;
  size: number;
  updatedAt: string;
}

export interface StorageBackend {
  put(key: string, data: Buffer | string, contentType?: string): Promise<StorageObject>;
  get(key: string): Promise<Buffer | null>;
  delete(key: string): Promise<void>;
  list(prefix?: string): Promise<StorageObject[]>;
  exists(key: string): Promise<boolean>;
}

function sanitizeKey(key: string): string {
  if (key.includes("..") || key.startsWith("/")) {
    throw new Error(`Unsafe storage key: ${key}`);
  }
  return key;
}

/** Real, tested local-filesystem backend. Default when AWS_S3_BUCKET isn't set. */
export class LocalFileStorage implements StorageBackend {
  constructor(private root: string) {}

  private resolvePath(key: string): string {
    return join(this.root, sanitizeKey(key));
  }

  async put(key: string, data: Buffer | string): Promise<StorageObject> {
    const path = this.resolvePath(key);
    await mkdir(dirname(path), { recursive: true });
    const buf = typeof data === "string" ? Buffer.from(data) : data;
    await writeFile(path, buf);
    const s = await stat(path);
    return { key, size: s.size, updatedAt: s.mtime.toISOString() };
  }

  async get(key: string): Promise<Buffer | null> {
    try {
      return await readFile(this.resolvePath(key));
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await unlink(this.resolvePath(key));
    } catch {
      /* already gone — deleting a missing key is not an error */
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await stat(this.resolvePath(key));
      return true;
    } catch {
      return false;
    }
  }

  async list(prefix = ""): Promise<StorageObject[]> {
    const dir = this.resolvePath(prefix || ".");
    let entries: string[];
    try {
      entries = await readdir(dir, { recursive: true } as never);
    } catch {
      return [];
    }
    const results: StorageObject[] = [];
    for (const entry of entries as unknown as string[]) {
      const fullPath = join(dir, entry);
      try {
        const s = await stat(fullPath);
        if (s.isFile()) {
          const key = prefix ? join(prefix, entry) : entry;
          results.push({ key, size: s.size, updatedAt: s.mtime.toISOString() });
        }
      } catch {
        /* file may have been removed between readdir and stat — skip it */
      }
    }
    return results;
  }
}

type S3ClientLike = {
  send(command: unknown): Promise<unknown>;
};

class S3Storage implements StorageBackend {
  constructor(private client: S3ClientLike, private bucket: string, private commands: typeof import("@aws-sdk/client-s3")) {}

  async put(key: string, data: Buffer | string, contentType?: string): Promise<StorageObject> {
    const { PutObjectCommand } = this.commands;
    const buf = typeof data === "string" ? Buffer.from(data) : data;
    await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: buf, ContentType: contentType }));
    return { key, size: buf.length, updatedAt: new Date().toISOString() };
  }

  async get(key: string): Promise<Buffer | null> {
    const { GetObjectCommand } = this.commands;
    try {
      const res = (await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }))) as { Body?: { transformToByteArray(): Promise<Uint8Array> } };
      if (!res.Body) return null;
      const bytes = await res.Body.transformToByteArray();
      return Buffer.from(bytes);
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    const { DeleteObjectCommand } = this.commands;
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async exists(key: string): Promise<boolean> {
    const { HeadObjectCommand } = this.commands;
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return true;
    } catch {
      return false;
    }
  }

  async list(prefix = ""): Promise<StorageObject[]> {
    const { ListObjectsV2Command } = this.commands;
    const res = (await this.client.send(new ListObjectsV2Command({ Bucket: this.bucket, Prefix: prefix }))) as {
      Contents?: Array<{ Key?: string; Size?: number; LastModified?: Date }>;
    };
    return (res.Contents ?? [])
      .filter((o) => o.Key)
      .map((o) => ({ key: o.Key!, size: o.Size ?? 0, updatedAt: (o.LastModified ?? new Date()).toISOString() }));
  }
}

let cachedBackend: StorageBackend | null = null;
let backendTried = false;
const localFallback = new LocalFileStorage(process.env.LOCAL_STORAGE_DIR || "/tmp/superior-ai-storage");

export async function getStorage(): Promise<StorageBackend> {
  if (backendTried) return cachedBackend ?? localFallback;
  backendTried = true;
  if (!process.env.AWS_S3_BUCKET) return localFallback;
  try {
    const mod = await import("@aws-sdk/client-s3");
    const client = new mod.S3Client({
      region: process.env.AWS_REGION || "us-east-1",
      endpoint: process.env.AWS_S3_ENDPOINT, // supports S3-compatible providers (R2, MinIO, etc.)
    });
    cachedBackend = new S3Storage(client as unknown as S3ClientLike, process.env.AWS_S3_BUCKET, mod);
    return cachedBackend;
  } catch {
    return localFallback;
  }
}

export function storageBackendHint(): "s3" | "local" {
  return process.env.AWS_S3_BUCKET ? "s3" : "local";
}
