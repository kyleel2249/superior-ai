/**
 * Root-cause graph — structured diagnosis, not automatic truth.
 */

export interface RootCauseNode {
  id: string;
  type: "symptom" | "cause" | "evidence" | "test" | "fix" | "verify";
  label: string;
  confidence?: number;
}

export interface RootCauseEdge {
  from: string;
  to: string;
  relation: "caused_by" | "supported_by" | "tested_by" | "fixed_by" | "verified_by";
}

export interface RootCauseGraph {
  id: string;
  title: string;
  nodes: RootCauseNode[];
  edges: RootCauseEdge[];
  confirmedCauseId?: string;
  status: "open" | "investigating" | "confirmed" | "resolved";
  createdAt: string;
}

const graphs = new Map<string, RootCauseGraph>();

export function createRootCauseGraph(input: {
  title: string;
  symptom: string;
  possibleCauses?: string[];
}): RootCauseGraph {
  const id = `rcg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const nodes: RootCauseNode[] = [
    { id: "symptom", type: "symptom", label: input.symptom, confidence: 1 },
  ];
  const edges: RootCauseEdge[] = [];
  const causes = input.possibleCauses ?? [
    "Process failure",
    "Data quality",
    "External dependency",
    "Human error",
    "Capacity constraint",
  ];
  causes.forEach((c, i) => {
    const cid = `cause_${i}`;
    nodes.push({ id: cid, type: "cause", label: c, confidence: 0.3 });
    edges.push({ from: "symptom", to: cid, relation: "caused_by" });
  });
  const g: RootCauseGraph = {
    id,
    title: input.title,
    nodes,
    edges,
    status: "investigating",
    createdAt: new Date().toISOString(),
  };
  graphs.set(id, g);
  return g;
}

export function addEvidence(
  graphId: string,
  causeId: string,
  evidence: string,
  confidence = 0.5
): RootCauseGraph {
  const g = graphs.get(graphId);
  if (!g) throw new Error("graph not found");
  const eid = `ev_${g.nodes.length}`;
  g.nodes.push({ id: eid, type: "evidence", label: evidence, confidence });
  g.edges.push({ from: causeId, to: eid, relation: "supported_by" });
  const cause = g.nodes.find((n) => n.id === causeId);
  if (cause) cause.confidence = Math.min(1, (cause.confidence ?? 0.3) + confidence * 0.4);
  return g;
}

export function confirmCause(graphId: string, causeId: string): RootCauseGraph {
  const g = graphs.get(graphId);
  if (!g) throw new Error("graph not found");
  g.confirmedCauseId = causeId;
  g.status = "confirmed";
  const cause = g.nodes.find((n) => n.id === causeId);
  if (cause) cause.confidence = 1;
  return g;
}

export function addFix(graphId: string, fix: string): RootCauseGraph {
  const g = graphs.get(graphId);
  if (!g) throw new Error("graph not found");
  const fid = `fix_${g.nodes.length}`;
  g.nodes.push({ id: fid, type: "fix", label: fix });
  if (g.confirmedCauseId) {
    g.edges.push({ from: g.confirmedCauseId, to: fid, relation: "fixed_by" });
  }
  return g;
}

export function resolveGraph(graphId: string, verification: string): RootCauseGraph {
  const g = graphs.get(graphId);
  if (!g) throw new Error("graph not found");
  const vid = `verify_${g.nodes.length}`;
  g.nodes.push({ id: vid, type: "verify", label: verification });
  g.edges.push({ from: "symptom", to: vid, relation: "verified_by" });
  g.status = "resolved";
  return g;
}

export function getRootCauseGraph(id: string): RootCauseGraph | undefined {
  return graphs.get(id);
}

export function listRootCauseGraphs(): RootCauseGraph[] {
  return [...graphs.values()];
}
