/**
 * Computes SOC 2 evidence-pack READINESS (template completion), not compliance.
 * A row counts as "collected" only when collected_date is filled and status
 * is not "pending" — never inferred, only what's actually in the CSV.
 * Shared by the CLI (`npm run soc2:readiness`) and the /api/compliance route.
 */
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const csvPath = join(root, "docs", "soc2", "Evidence_Index.csv");

function parseCsv(text) {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(",").map((c) => c.trim());
    const row = {};
    headers.forEach((h, i) => (row[h] = cells[i] ?? ""));
    return row;
  });
}

export function computeSoc2Readiness() {
  if (!existsSync(csvPath)) {
    return { available: false, reason: "Evidence_Index.csv not found" };
  }
  const rows = parseCsv(readFileSync(csvPath, "utf8"));
  const byCriterion = {};

  for (const row of rows) {
    const criterion = row.criterion || "UNKNOWN";
    const collected = Boolean(row.collected_date) && row.status !== "pending";
    const hasUnfilledBrackets = /\[[A-Z_]+\]/.test(row.location || "") || /\[[A-Z_]+\]/.test(row.owner || "");
    byCriterion[criterion] ??= { total: 0, collected: 0, unfilledOwnerOrLocation: 0, items: [] };
    byCriterion[criterion].total += 1;
    if (collected) byCriterion[criterion].collected += 1;
    if (hasUnfilledBrackets) byCriterion[criterion].unfilledOwnerOrLocation += 1;
    byCriterion[criterion].items.push({
      evidence_id: row.evidence_id,
      description: row.description,
      status: row.status || "pending",
      collected: collected,
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

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const result = computeSoc2Readiness();
  if (!result.available) {
    console.error(`SOC2 readiness: ${result.reason}`);
    process.exit(1);
  }
  console.log(`SOC2 evidence-pack readiness: ${result.overallPercent}% (template completion, not certification)\n`);
  for (const [criterion, data] of Object.entries(result.byCriterion)) {
    const pct = Math.round((data.collected / data.total) * 100);
    console.log(`  ${criterion}: ${data.collected}/${data.total} collected (${pct}%)`);
  }
}
