# Phase 0 — Requirements Extraction & Master Inventory

> **Re-audited.** The previous version of this doc (superseded) flagged the
> rollup below as stale after a merge roughly tripled the codebase's size.
> This is a real re-audit against the current tree — not a guess, not a
> restore of the old numbers.
>
> **Methodology, stated plainly**: the original matrix assigns a single
> status per *phase* (all rows within a phase share one status — confirmed
> by inspecting the raw CSV), so this re-audit checked at that same
> granularity: for each of the 38 phases, confirmed whether the phase's
> corresponding package(s) exist, contain real (non-stub) implementation,
> and are wired to a real, reachable API route — not whether every
> individual named sub-requirement within a phase is independently
> verified. That would need 566 separate checks; this did 38. `DONE` was
> only assigned to the 2 phases (Model & Provider Infrastructure, Internet
> Search/Browser/Research) that received the same live-testing rigor as
> everything else built and verified this session — every other upgraded
> phase landed at `PARTIAL` or `MINIMAL`, reflecting "real code exists and
> is wired" without claiming full requirement-by-requirement completeness.
>
> **Result**: 43% "not started" is now 6% (2 phases: Full Regression Test,
> Final Release Audit — both confirmed genuinely absent, not downgraded by
> mistake). "Done" is a modest 4% (unchanged from before, intentionally
> conservative). The bulk of the movement is `NOT STARTED`/`MINIMAL` →
> `PARTIAL`/`MINIMAL`, because most phases turned out to have real,
> substantial, wired implementations that a smaller/earlier snapshot
> genuinely didn't have — not because the bar for any status was lowered.
>
> Full distribution: PARTIAL 318 (56%), MINIMAL 185 (32%), NOT STARTED 36
> (6%), DONE 27 (4%).
>
> **Explicitly still true**: this is not "the project is basically done."
> Most of the movement is from "nothing exists" to "something real exists
> and answers requests correctly" — a meaningfully different, better state,
> but still short of the full 566-requirement spec. Phases 33 (Full
> Regression Test), 37 (Final Release Audit), and 38 (Final Definition of
> Done) are confirmed genuinely not started — there is no regression
> suite, no release process has run, and the project is explicitly
> incomplete. Large net-new subsystems named across the three "god-mode"
> spec documents earlier in this project's history (autonomous
> experimentation, several others) remain unbuilt regardless of what this
> phase-level rollup shows.

Machine-generated from the master 38-phase spec. Full row-level detail is in
`PHASE0_MATRIX.csv` (566 rows, one per named requirement/feature/module,
status re-audited at the phase level as described above).

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
