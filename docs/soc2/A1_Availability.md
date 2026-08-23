# A1 — Availability

## Control statement
The system maintains availability commitments through capacity management and recovery.

## How addressed in product
- Multi-provider model registry + failover posture
- BullMQ workers + Redis queue
- Multi-region failover playbook (`docs/runbook/MULTI_REGION.md`)
- Postgres + Redis healthchecks in compose/CI
- Continuous capacity design (never hard-stop on single provider)

## Evidence to collect
| ID | Artifact | Owner | Location |
|----|----------|-------|----------|
| A1-1 | Uptime report / status page history | [SRE] | `/status` |
| A1-2 | Backup schedule + restore test | [SRE] | [RUNBOOK_DATE] |
| A1-3 | RTO/RPO definitions | [CTO] | MULTI_REGION.md |
| A1-4 | Failover drill notes | [SRE] | [LINK] |

## Test procedure
1. Drain primary model provider → router selects fallback.  
2. Redis restart → queue recovers or memory fallback documented.  

## Period
[START_DATE] – [END_DATE]
