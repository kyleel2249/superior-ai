import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { __superiorPrisma?: PrismaClient };

export function createPrismaClient(): PrismaClient | null {
  if (!process.env.DATABASE_URL) return null;
  try {
    return globalForPrisma.__superiorPrisma ?? new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  } catch {
    return null;
  }
}

export const prisma = createPrismaClient();
if (prisma && process.env.NODE_ENV !== "production") {
  globalForPrisma.__superiorPrisma = prisma;
}

export function isDatabaseReady(): boolean {
  return prisma !== null;
}
