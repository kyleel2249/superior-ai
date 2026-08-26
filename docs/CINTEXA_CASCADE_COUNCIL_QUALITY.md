# CINTEXA — Cascade, Council, Quality Engine, Control Center

**Status:** Integrated into SUPERIOR AI gateway

## Model Cascade
`planCascade(text)` — worker → balanced → advanced → frontier → panel → human_review  
Escalate on quality/confidence/tool failure — not on availability alone.

## Model Council
Roles: strategist, researcher, engineer, critic, risk_analyst, judge  
Disagreement: claim extraction → evidence → verifier → escalate (no averaging)

## Quality Engine
Structural quality scoring (0–100) + recommended action  
Gates: accept | retry | increase_reasoning | switch_model | ensemble | escalate_human  
Does **not** claim factual ground-truth verification without tools/sources.

## AI Control Center
UI: `/admin/control`  
API: `POST /api/cintexa` actions `cascade` | `council` | `quality` | `disagreement` | `council_cascade`

## Honesty
Live multi-model execution requires AVAILABLE models + `OPENROUTER_API_KEY`.  
Internal credits remain UNLIMITED.
