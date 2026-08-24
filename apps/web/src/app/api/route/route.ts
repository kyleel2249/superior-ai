import { NextRequest, NextResponse } from "next/server";
import {
  classifyTask,
  planEnsemble,
  detectConflict,
  synthesizeFinal,
  route,
} from "@superior-ai/ai-gateway";
import { planCouncilPasses, CRITIC_SYSTEM, VERIFIER_SYSTEM, SYNTHESIS_SYSTEM } from "@superior-ai/agents";
import type { IntelligenceLevel } from "@superior-ai/core";

/**
 * Model router & multi-model council planner API.
 * Plans routing and ensemble; does not invent multi-provider answers without keys.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = String(body.message ?? body.objective ?? body.text ?? "").trim();
    if (!text) {
      return NextResponse.json({ error: "message or objective required" }, { status: 400 });
    }

    const action = String(body.action ?? "plan");
    const level = (body.intelligenceLevel as IntelligenceLevel | undefined) ?? undefined;

    if (action === "classify") {
      const request = classifyTask(text, level ? { intelligenceLevel: level } : undefined);
      return NextResponse.json({ request });
    }

    if (action === "route") {
      const request = classifyTask(text, level ? { intelligenceLevel: level } : undefined);
      const decision = route(request);
      return NextResponse.json({
        request,
        decision: {
          primary: decision.primary.displayName,
          primaryId: decision.primary.modelId,
          provider: decision.primary.provider,
          secondary: decision.secondary?.displayName,
          critic: decision.critic?.displayName,
          factCheck: decision.factCheck?.displayName,
          executor: decision.executor?.displayName,
          fallback: decision.fallback.map((m) => m.displayName),
          reason: decision.reason,
        },
      });
    }

    if (action === "conflict") {
      const answers = Array.isArray(body.answers) ? body.answers : [];
      return NextResponse.json(detectConflict(answers));
    }

    if (action === "synthesize") {
      const final = synthesizeFinal({
        primary: String(body.primary ?? ""),
        secondary: body.secondary,
        critic: body.critic,
        verifier: body.verifier,
        conflictNotes: body.conflictNotes,
      });
      return NextResponse.json({ final, singleFinal: true });
    }

    // default: full ensemble plan
    const plan = planEnsemble(text, level ? { intelligenceLevel: level } : undefined);
    const council = planCouncilPasses(plan.request.intelligenceLevel);

    return NextResponse.json({
      plan: {
        mode: plan.mode,
        parallel: plan.parallel,
        conflictPolicy: plan.conflictPolicy,
        synthesisRules: plan.synthesisRules,
        toolApprovalRequired: plan.toolApprovalRequired,
        request: plan.request,
        roles: plan.roles,
        reason: plan.decision.reason,
      },
      council,
      prompts: {
        critic: CRITIC_SYSTEM,
        verifier: VERIFIER_SYSTEM,
        synthesis: SYNTHESIS_SYSTEM,
      },
      note: "Plan only — live multi-model calls require configured provider keys and executor wiring.",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoints: {
      POST: {
        actions: ["plan", "classify", "route", "conflict", "synthesize"],
        body: {
          message: "task text",
          intelligenceLevel: "FAST|BALANCED|DEEP|EXPERT|MAXIMUM|SUPREME|AUTONOMOUS",
          action: "plan",
        },
      },
    },
  });
}
