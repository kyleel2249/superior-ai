import { describe, it, expect } from "vitest";
import {
  scoreLead,
  createLeadShell,
  autopilotAllowedActions,
  upsertLead,
  qualifyLead,
  createDealFromLead,
  listDeals,
} from "../engine";

describe("scoreLead", () => {
  it("weights fit 40%, intent 35%, engagement 25% into the opportunity score", () => {
    const intel = scoreLead({ industryFit: 100, sizeFit: 100, publicSignals: 0, engagement: 0 });
    expect(intel.fitScore).toBe(100);
    expect(intel.opportunityScore).toBe(40); // 100*0.4 + 0*0.35 + 0*0.25
  });

  it("closeProbability formula (opportunity * 0.7) never actually reaches the 85 cap given 0-100 inputs", () => {
    const intel = scoreLead({ industryFit: 100, sizeFit: 100, publicSignals: 100, engagement: 100 });
    expect(intel.opportunityScore).toBe(100);
    // Documents current behavior: the min(85, ...) cap in scoreLead is
    // unreachable in practice since max opportunity (100) * 0.7 = 70.
    // Not a bug — just noting the cap has no effect at today's input range.
    expect(intel.closeProbability).toBe(70);
  });

  it("riskScore is always the complement of closeProbability", () => {
    const intel = scoreLead({ industryFit: 60, sizeFit: 40, publicSignals: 50, engagement: 30 });
    expect(intel.riskScore).toBe(100 - intel.closeProbability);
  });

  it("gives a shorter expected close window above the 50% probability threshold", () => {
    const strong = scoreLead({ industryFit: 90, sizeFit: 90, publicSignals: 90, engagement: 90 });
    const weak = scoreLead({ industryFit: 10, sizeFit: 10, publicSignals: 10, engagement: 10 });
    expect(strong.closeProbability).toBeGreaterThan(50);
    expect(strong.expectedDaysToClose).toBe(30);
    expect(weak.closeProbability).toBeLessThanOrEqual(50);
    expect(weak.expectedDaysToClose).toBe(60);
  });
});

describe("createLeadShell", () => {
  it("starts unqualified with low confidence and explicit Model Inference provenance", () => {
    const lead = createLeadShell("Acme Corp", "https://acme.com");
    expect(lead.status).toBe("new");
    expect(lead.confidence).toBe(20);
    expect(lead.provenance).toBe("Model Inference");
    expect(lead.publicContacts).toEqual([]);
  });

  it("slugifies the company name into the id", () => {
    const lead = createLeadShell("Acme & Sons, Co.");
    expect(lead.id).toMatch(/^lead_acme_sons_co_/);
  });
});

describe("autopilotAllowedActions", () => {
  it("assist mode never includes autonomous send/schedule actions", () => {
    const actions = autopilotAllowedActions("assist");
    expect(actions).not.toContain("send_approved_campaigns");
    expect(actions).not.toContain("schedule_meetings");
  });

  it("only fully autonomous mode can send campaigns and schedule meetings", () => {
    for (const mode of ["assist", "recommend", "semi_autonomous"] as const) {
      expect(autopilotAllowedActions(mode)).not.toContain("send_approved_campaigns");
    }
    expect(autopilotAllowedActions("autonomous")).toContain("send_approved_campaigns");
    expect(autopilotAllowedActions("autonomous")).toContain("schedule_meetings");
  });

  it("every tier includes a way to prepare outreach — 'draft_outreach' in early tiers, 'prepare_outreach' once autonomous", () => {
    for (const mode of ["assist", "recommend", "semi_autonomous"] as const) {
      expect(autopilotAllowedActions(mode)).toContain("draft_outreach");
    }
    expect(autopilotAllowedActions("autonomous")).toContain("prepare_outreach");
  });
});

describe("lead qualification pipeline", () => {
  it("only qualifies once fitScore >= 50 AND intentScore >= 40, not on either alone", () => {
    const lead = createLeadShell(`QualCo-${Math.random()}`);
    upsertLead(lead);

    qualifyLead(lead.id, { fitScore: 60, intentScore: 10 });
    expect(lead.status).toBe("new"); // fit ok, intent too low

    qualifyLead(lead.id, { fitScore: 60, intentScore: 45 });
    expect(lead.status).toBe("qualified");
  });

  it("confidence increases but never exceeds 90", () => {
    const lead = createLeadShell(`ConfCo-${Math.random()}`);
    upsertLead(lead);
    for (let i = 0; i < 10; i++) {
      qualifyLead(lead.id, { fitScore: 10, intentScore: 10 });
    }
    expect(lead.confidence).toBeLessThanOrEqual(90);
  });

  it("returns null for a lead id that was never upserted", () => {
    expect(qualifyLead("lead_nonexistent", { fitScore: 90 })).toBeNull();
  });
});

describe("createDealFromLead", () => {
  it("carries the lead's opportunityScore into closeProbability and complementary riskScore", () => {
    const lead = createLeadShell(`DealCo-${Math.random()}`);
    lead.opportunityScore = 72;
    const deal = createDealFromLead(lead, { value: 5000 });
    expect(deal.closeProbability).toBe(72);
    expect(deal.riskScore).toBe(28);
    expect(deal.value).toBe(5000);
  });

  it("moves the source lead's status to opportunity as a side effect", () => {
    const lead = createLeadShell(`DealCo2-${Math.random()}`);
    createDealFromLead(lead, {});
    expect(lead.status).toBe("opportunity");
  });

  it("registers the deal so listDeals() can find it, with a non-colliding id", () => {
    const leadA = createLeadShell(`DealA-${Math.random()}`);
    const leadB = createLeadShell(`DealB-${Math.random()}`);
    const dealA = createDealFromLead(leadA, {});
    const dealB = createDealFromLead(leadB, {});
    expect(dealA.id).not.toBe(dealB.id);
    const ids = listDeals().map((d) => d.id);
    expect(ids).toContain(dealA.id);
    expect(ids).toContain(dealB.id);
  });
});
