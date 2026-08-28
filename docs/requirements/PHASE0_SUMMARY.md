# Phase 0 — Requirements Extraction & Master Inventory

> **⚠️ STATUS ROLLUP BELOW IS STALE.** It was generated against a snapshot of
> this codebase from before a merge that roughly tripled its size (new
> packages, ~65 API routes, ~24 pages, dozens of subsystems built by a
> parallel session and since verified/extended). The percentages below do
> **not** reflect current reality — treat "43% not started" as describing a
> codebase that no longer exists. A full row-by-row re-audit against the
> current tree is real, separately-scoped work (566 rows, each needs an
> actual read of the corresponding code, not a guess) — it hasn't been done.
>
> What follows instead: specific, evidence-backed findings from live
> verification across several sessions of actually reading and testing this
> codebase — not a new percentage, since I haven't earned one. Each claim
> below was confirmed by reading the actual implementation and/or a live
> test, not assumed from the spec matching a filename.
>
> **Confirmed real and working** (build-verified, several live-tested):
> Model registry with real OpenRouter model ID mappings (though display
> names are stylized re-labelings — flagged separately, worth a naming
> decision); OpenRouter/OpenAI/Google/Anthropic/xAI provider adapters;
> model discovery with a real staged lifecycle (DISCOVERED → EVALUATING →
> APPROVED → ACTIVE, gated by real sandbox checks, not a formality);
> canary rollout with auto-rollback; benchmark lab (single-model health
> check plus a category-based golden-task suite, both honest — no
> fabricated pass/fail); digital twin, scenario simulator, SLA/incident
> management, KPI intelligence, root-cause graph, economics rollup,
> capacity planner, entity/knowledge graph — all wired to real API routes
> with real logic, not orphaned; disagreement engine (real structural
> claim comparison); governance board (six real seats built on a real risk
> scorer); agent auction (real tool/permission/load/track-record bidding);
> 15 real web search engines including honest stubs for the 2 that
> genuinely can't work without a partner API; full OAuth2/OIDC login flow
> with real JWKS verification and (as of this session) CSRF-protected
> state handling; Stripe-backed pack marketplace checkout; a design system
> genuinely applied across all ~24 pages, not just declared.
>
> **Confirmed real but functionally unverified beyond typecheck/build**:
> most of the above have never been exercised against a live external
> provider from this sandbox (network policy blocks it) — verified
> honest-failure behavior when unconfigured, not verified success against
> a real OpenRouter/Stripe/OIDC provider account.
>
> **Known gaps, not yet built**: model council disagreement resolution has
> no live multi-model execution path (requires real provider keys);
> several large subsystems from the "god-mode" specs remain unbuilt
> (autonomous experimentation, AI economics P&L dashboard, several others
> enumerated in the chat history but not restated here).
>
> If a real re-audit against the current tree is wanted, that's a
> legitimate next task — it would mean systematically reading each of the
> 566 rows' corresponding code paths, not re-running whatever produced the
> numbers below.

Machine-generated from the master 38-phase spec. Full row-level detail is in
`PHASE0_MATRIX.csv` (566 rows, one per named requirement/feature/module).
**This matrix itself is from the same stale snapshot described above.**

## Acceptance gate checklist

- [x] 100% of requirements extracted — 566 rows across all 38 phases
- [x] 100% categorized — every row has one of the spec's 22 category labels
- [x] 100% mapped to a phase — all 38 phases represented, 0 unmapped rows
- [x] Dependencies identified — every row has a `dependency` (prior phase) field
- [ ] Conflicts identified — none found requiring architectural rework; see note below
- [x] External API requirements identified — 9 phases have explicit external-dependency notes (see table below)
- [x] Unsupported/future model names identified — see note below
- [x] No duplicate requirements — verified 0 duplicate (phase, module, requirement) rows

## Status rollup

| Status | Count | % of 566 |
|---|---|---|
| DONE | 27 | 5% |
| PARTIAL | 100 | 18% |
| MINIMAL | 194 | 34% |
| NOT STARTED | 245 | 43% |

**5% done, 18% partial, 34% minimal, 43% not started.** This is a fair reading of
where the codebase actually is against the full spec — not a criticism of the
spec's scope, just an honest starting point for Phase 1 onward.

## By category

| Category | Total | Done | Partial | Minimal | Not Started |
|---|---|---|---|---|---|
| AGENT | 22 | 0 | 19 | 0 | 3 |
| AI | 28 | 9 | 0 | 8 | 11 |
| AUTOMATION | 16 | 0 | 0 | 16 | 0 |
| BUSINESS | 53 | 0 | 15 | 29 | 9 |
| CORE | 124 | 0 | 21 | 0 | 103 |
| CREATIVE | 10 | 0 | 0 | 10 | 0 |
| CUSTOMER | 17 | 0 | 0 | 0 | 17 |
| DESIGN | 22 | 0 | 0 | 9 | 13 |
| FINANCE | 6 | 0 | 0 | 6 | 0 |
| IMAGE | 16 | 0 | 0 | 16 | 0 |
| INFRASTRUCTURE | 26 | 0 | 10 | 0 | 16 |
| INTEGRATION | 18 | 7 | 0 | 11 | 0 |
| MARKETING | 37 | 0 | 0 | 25 | 12 |
| MEMORY | 24 | 0 | 24 | 0 | 0 |
| OPERATIONS | 14 | 0 | 0 | 14 | 0 |
| RESEARCH | 11 | 11 | 0 | 0 | 0 |
| SALES | 16 | 0 | 0 | 16 | 0 |
| SECURITY | 11 | 0 | 11 | 0 | 0 |
| SEO | 14 | 0 | 0 | 14 | 0 |
| SOFTWARE | 29 | 0 | 0 | 20 | 9 |
| UX | 27 | 0 | 0 | 0 | 27 |
| VIDEO | 25 | 0 | 0 | 0 | 25 |

## External API / provider dependencies flagged

| Phase | Dependency |
|---|---|
| 3 (Model & Provider Infrastructure) | OpenAI/Anthropic/xAI/Google/OpenRouter API keys |
| 6 (File, Document & Multimodal Intelligence) | OCR/transcription provider (none chosen) |
| 7 (Internet Search, Browser & Deep Research) | Brave/Bing/Google CSE/Wolfram API keys (DuckDuckGo needs none) |
| 12 (Image & Brand Studio) | OpenAI DALL-E API key |
| 14 (Video & Cinematic Studio) | No video-gen provider selected (Runway/Pika/Sora candidates, none wired) |
| 15 (UGC, Avatar & Media Cloning) | No avatar/voice-clone provider selected; requires likeness/voice authorization flow |
| 19 (Competitor & Traffic Intelligence) | No traffic-estimation provider (SimilarWeb-class) selected |
| 20 (Sales & Revenue Engine) | HubSpot/Salesforce API credentials (per-org) |
| 25 (Social Media & Autopublishing) | Meta/X/LinkedIn/TikTok OAuth apps not registered — no live posting yet |

## Unsupported / future model names

The spec doesn't name specific model versions, so there's nothing to flag as
unsupported yet. The one real risk: the model registry's seed catalog
(`packages/ai-gateway/src/registry/model-registry.ts`) hardcodes model ID strings
per provider (e.g. `gpt-4o`, `claude-sonnet-5`, `gemini-2.5-pro`) that will drift
out of date as providers ship new models — that registry needs a refresh pass
before relying on it for routing decisions in production.

## Architectural conflicts

No hard conflicts between phases' requirements. Two soft tensions worth flagging
before later phases build on top of them:

1. **Phase 2 (no mandatory sign-in) vs. the auth/session/org layer already built
   in Phase 8's foundation.** *(Update: verified resolved, not open — see note
   below.)* The current `packages/auth` assumes a session exists
   for permission checks (`hasPermission`, org membership). Phase 2's local-first
   flow needs a default anonymous/local session, not a redesign — but this should
   be resolved explicitly in Phase 2, not assumed.
   **Resolution found**: `packages/workspace` already sets `authRequired: false`
   and `unlimitedWorkspace: true` explicitly — confirmed by reading it directly
   in an earlier verification pass. The local-first flow doesn't go through the
   auth layer's permission checks at all. This was resolved by the codebase
   itself, not by explicit Phase 2 work — no longer an open risk.
2. **In-process state vs. Phase 31 (scalability)**. Nearly every module built so
   far (job queue, rate limiter, factory tasks, revenue events, org/session store)
   holds state in a JS module-level variable. That's fine for a single dev
   instance and is why Phase 1's remaining gaps (real queue, real cache) are the
   recommended next step — every one of those modules will need revisiting once
   persistence is real, so doing that early avoids rework.

## Dependency map (phase -> prerequisite)

Phase 0 rule: "foundational systems are built before dependent features." Directly
prerequisite phase per phase, based on what each phase's features actually require:

| Phase | Depends on |
|---|---|
| 1 | 1 (foundation) |
| 2 | 1 (foundation) |
| 3 | 1 |
| 4 | 3 |
| 5 | 1 |
| 6 | 1 |
| 7 | 1, 5 (for research memory) |
| 8 | 1, 3 |
| 9 | 8 |
| 10 | 8, 3 |
| 11 | 10 |
| 12 | 3, 8 |
| 13 | 12 |
| 14 | 3, 8, 12 |
| 15 | 14 |
| 16 | 12, 14 |
| 17 | 3, 7 |
| 18 | 7, 17 |
| 19 | 7, 18 |
| 20 | 1, 5, 8 |
| 21 | 5, 8 |
| 22 | 18, 19, 20 |
| 23 | 1, 5 |
| 24 | 1, 8 |
| 25 | 16, 18 |
| 26 | 1, 5 |
| 27 | 3 |
| 28 | 5, 26, 19, 20, 21, 23 |
| 29 | 1 |
| 30 | 1, 29 |
| 31 | 1 |
| 32 | 3-31 (integration test of everything) |
| 33 | 32 |
| 34 | 33 |
| 35 | 32 |
| 36 | 1-35 |
| 37 | 32-36 |
| 38 | 37 |
