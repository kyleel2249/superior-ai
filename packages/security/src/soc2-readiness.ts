/**
 * SOC2 evidence-pack READINESS (template completion), not a compliance or
 * certification claim. Reads the same docs/soc2/Evidence_Index.csv tracker
 * used by `npm run soc2:readiness`. Every number here is derived directly
 * from that CSV — nothing is estimated or assumed.
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";

export interface Soc2ReadinessItem {
  evidence_id: string;
  description: string;
  status: string;
  collected: boolean;
  ownerAssigned: boolean;
}

export interface Soc2ReadinessCriterion {
  total: number;
  collected: number;
  unfilledOwnerOrLocation: number;
  items: Soc2ReadinessItem[];
}

export interface Soc2Readiness {
  available: boolean;
  reason?: string;
  generatedAt?: string;
  note?: string;
  overallPercent?: number;
  totals?: { total: number; collected: number };
  byCriterion?: Record<string, Soc2ReadinessCriterion>;
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n");
  const headers = lines[0]!.split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(",").map((c) => c.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = cells[i] ?? ""));
    return row;
  });
}

/** repoRoot lets callers (Next.js API routes, scripts) pass process.cwd() or a computed root. */
export function computeSoc2Readiness(repoRoot: string): Soc2Readiness {
  const csvPath = join(repoRoot, "docs", "soc2", "Evidence_Index.csv");
  if (!existsSync(csvPath)) {
    return { available: false, reason: "Evidence_Index.csv not found" };
  }

  const rows = parseCsv(readFileSync(csvPath, "utf8"));
  const byCriterion: Record<string, Soc2ReadinessCriterion> = {};

  for (const row of rows) {
    const criterion = row.criterion || "UNKNOWN";
    const collected = Boolean(row.collected_date) && row.status !== "pending";
    const hasUnfilledBrackets =
      /\[[A-Z_]+\]/.test(row.location || "") || /\[[A-Z_]+\]/.test(row.owner || "");
    const bucket = (byCriterion[criterion] ??= {
      total: 0,
      collected: 0,
      unfilledOwnerOrLocation: 0,
      items: [],
    });
    bucket.total += 1;
    if (collected) bucket.collected += 1;
    if (hasUnfilledBrackets) bucket.unfilledOwnerOrLocation += 1;
    bucket.items.push({
      evidence_id: row.evidence_id ?? "",
      description: row.description ?? "",
      status: row.status || "pending",
      collected,
      ownerAssigned: !/\[[A-Z_]+\]/.test(row.owner || ""),
    });
  }

  const totals = Object.values(byCriterion).reduce(
    (acc, c) => ({ total: acc.total + c.total, collected: acc.collected + c.collected }),
    { total: 0, collected: 0 }
  );

  return {
    available: true,
    generatedAt: new Date().toISOString(),
    note: "Readiness = evidence-tracker completion, not an audit outcome or certification.",
    overallPercent: totals.total > 0 ? Math.round((totals.collected / totals.total) * 100) : 0,
    totals,
    byCriterion,
  };
}
