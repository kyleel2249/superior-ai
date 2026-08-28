/**
 * Agent Auction / Task Matching
 * Agents "bid" on tasks based on real, measurable fit — skill/tool overlap,
 * permission match, current load vs maxParallel, and tracked historical
 * success rate. The highest-scoring eligible agent wins. No bid factor is
 * invented; everything traces to the agent's real definition or tracked
 * outcome history.
 */

import type { AgentDefinition } from "@superior-ai/core";

export interface TaskListing {
  id: string;
  title: string;
  department?: string;
  requiredTools: string[];
  requiredPermissions: string[];
  complexity: 0 | 1 | 2 | 3 | 4 | 5;
  priority: "P0" | "P1" | "P2" | "P3" | "P4";
}

export interface AgentBid {
  agentId: string;
  agentName: string;
  score: number; // 0-100
  skillMatch: number; // 0-100, tool overlap
  permissionMatch: boolean;
  currentLoad: number;
  maxParallel: number;
  historicalSuccessRate: number | null; // null = no track record yet
  eligible: boolean;
  reasons: string[];
}

export interface AuctionResult {
  taskId: string;
  bids: AgentBid[];
  winner: AgentBid | null;
  decidedAt: string;
}

interface AgentTrackRecord {
  agentId: string;
  completed: number;
  succeeded: number;
}

const trackRecords = new Map<string, AgentTrackRecord>();
const currentLoad = new Map<string, number>();

export function recordTaskOutcome(agentId: string, success: boolean): void {
  const r = trackRecords.get(agentId) ?? { agentId, completed: 0, succeeded: 0 };
  r.completed += 1;
  if (success) r.succeeded += 1;
  trackRecords.set(agentId, r);
}

export function getSuccessRate(agentId: string): number | null {
  const r = trackRecords.get(agentId);
  if (!r || r.completed === 0) return null;
  return Math.round((r.succeeded / r.completed) * 100);
}

export function setAgentLoad(agentId: string, activeTaskCount: number): void {
  currentLoad.set(agentId, activeTaskCount);
}

export function getAgentLoad(agentId: string): number {
  return currentLoad.get(agentId) ?? 0;
}

function toolOverlapScore(agentTools: string[], required: string[]): number {
  if (required.length === 0) return 100;
  const agentSet = new Set(agentTools);
  const matched = required.filter((t) => agentSet.has(t)).length;
  return Math.round((matched / required.length) * 100);
}

function hasAllPermissions(agentPermissions: string[], required: string[]): boolean {
  const set = new Set(agentPermissions);
  return required.every((p) => set.has(p));
}

export function bidForTask(agent: AgentDefinition, task: TaskListing): AgentBid {
  const reasons: string[] = [];

  const skillMatch = toolOverlapScore(agent.tools, task.requiredTools);
  const permissionMatch = hasAllPermissions(agent.permissions, task.requiredPermissions);
  const load = getAgentLoad(agent.id);
  const maxParallel = agent.maxParallel ?? 1;
  const successRate = getSuccessRate(agent.id);

  if (!permissionMatch) reasons.push("Missing required permission(s) — not eligible");
  if (load >= maxParallel) reasons.push(`At capacity (${load}/${maxParallel} active tasks) — not eligible`);
  if (skillMatch < 100 && task.requiredTools.length > 0) {
    reasons.push(`Partial tool match: ${skillMatch}% of required tools available`);
  }

  const eligible = permissionMatch && load < maxParallel;

  if (!eligible) {
    return {
      agentId: agent.id,
      agentName: agent.displayName,
      score: 0,
      skillMatch,
      permissionMatch,
      currentLoad: load,
      maxParallel,
      historicalSuccessRate: successRate,
      eligible: false,
      reasons,
    };
  }

  // Weighted score: skill fit matters most, then track record, then availability headroom
  const availabilityHeadroom = Math.round(((maxParallel - load) / maxParallel) * 100);
  const trackRecordComponent = successRate ?? 60; // neutral prior for agents with no history yet
  const score = Math.round(skillMatch * 0.5 + trackRecordComponent * 0.3 + availabilityHeadroom * 0.2);

  reasons.push(
    successRate === null
      ? "No prior track record — scored with a neutral 60% prior"
      : `Historical success rate: ${successRate}% over ${trackRecords.get(agent.id)?.completed ?? 0} completed tasks`
  );

  return {
    agentId: agent.id,
    agentName: agent.displayName,
    score,
    skillMatch,
    permissionMatch,
    currentLoad: load,
    maxParallel,
    historicalSuccessRate: successRate,
    eligible: true,
    reasons,
  };
}

export function runAuction(task: TaskListing, candidates: AgentDefinition[]): AuctionResult {
  const bids = candidates.map((a) => bidForTask(a, task)).sort((a, b) => b.score - a.score);
  const winner = bids.find((b) => b.eligible) ?? null;

  return {
    taskId: task.id,
    bids,
    winner,
    decidedAt: new Date().toISOString(),
  };
}
