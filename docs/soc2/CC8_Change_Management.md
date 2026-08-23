# CC8 — Change Management

## Control statement
Changes to production are authorized, tested, and logged.

## How addressed in product
- GitHub CI: smoke tests, pgvector, prisma push
- Playwright e2e suite
- Helm chart versioned deploys
- Social publish requires `approved: true` (human gate)

## Evidence to collect
| ID | Artifact | Owner | Location |
|----|----------|-------|----------|
| CC8-1 | PR + approval for production release | [ENG] | GitHub |
| CC8-2 | CI run URL (green) | [ENG] | Actions |
| CC8-3 | Helm release revision | [SRE] | `helm history` |
| CC8-4 | Change ticket | [ENG] | [TICKET] |

## Test procedure
1. Merge without CI → blocked by branch protection (configure in GitHub).  
2. Production deploy only from tagged/main builds.  

## Period
[START_DATE] – [END_DATE]
