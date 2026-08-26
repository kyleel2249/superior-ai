/**
 * AI Capacity Planner — forecast demand vs capacity from simple inputs.
 */

export interface CapacityInput {
  expectedTasksPerDay: number;
  avgLatencySec: number;
  concurrency: number;
  providerErrorRate?: number;
  growthPctPerWeek?: number;
  weeks?: number;
}

export interface CapacityPlan {
  dailyThroughput: number;
  utilization: number;
  queueRisk: "low" | "medium" | "high";
  weeklyForecast: Array<{ week: number; tasks: number; utilization: number }>;
  recommendations: string[];
  at: string;
}

export function planCapacity(input: CapacityInput): CapacityPlan {
  const hours = 24;
  const effectiveConcurrency = Math.max(1, input.concurrency);
  const latency = Math.max(0.1, input.avgLatencySec);
  const error = Math.min(0.5, Math.max(0, input.providerErrorRate ?? 0));
  // throughput: concurrent slots * (3600/latency) * hours * (1-error)
  const dailyThroughput =
    effectiveConcurrency * (3600 / latency) * hours * (1 - error);
  const utilization = input.expectedTasksPerDay / dailyThroughput;
  const queueRisk: CapacityPlan["queueRisk"] =
    utilization > 0.85 ? "high" : utilization > 0.6 ? "medium" : "low";

  const weeks = input.weeks ?? 4;
  const growth = (input.growthPctPerWeek ?? 0) / 100;
  const weeklyForecast = [];
  for (let w = 1; w <= weeks; w++) {
    const tasks = input.expectedTasksPerDay * Math.pow(1 + growth, w);
    weeklyForecast.push({
      week: w,
      tasks: Math.round(tasks),
      utilization: Math.round((tasks / dailyThroughput) * 1000) / 1000,
    });
  }

  const recommendations: string[] = [];
  if (queueRisk === "high") {
    recommendations.push("Increase concurrency or add provider capacity");
    recommendations.push("Route simple tasks to lower-latency models");
  }
  if (error > 0.05) recommendations.push("Improve provider health / expand fallbacks");
  if (growth > 0.1) recommendations.push("Pre-scale workers ahead of growth");
  if (!recommendations.length) recommendations.push("Capacity adequate under current assumptions");

  return {
    dailyThroughput: Math.round(dailyThroughput),
    utilization: Math.round(utilization * 1000) / 1000,
    queueRisk,
    weeklyForecast,
    recommendations,
    at: new Date().toISOString(),
  };
}
