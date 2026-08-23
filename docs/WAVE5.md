# Wave 5

## Auth UI + OIDC
- `/login` — dev login or SSO button when OIDC env set
- `/api/auth/oidc/login` + `/callback` — authorization code scaffold
- Production: prefer Auth.js with JWKS validation

## pgvector
- `packages/db/prisma/migrations/001_pgvector.sql`
- KnowledgeItem embeddingModel field
- UsageMeter + BillingBudget models

## Billing
- Meter events, budgets, hard-stop, estimates
- `GET/POST /api/billing`

## E2E
- Playwright config + `e2e/smoke.spec.ts`
- `npm run test:e2e`

## Helm
- `deploy/helm/superior-ai` — web + worker deployments

## Social
- Facebook Page feed publish when PAGE_ID + token set
- YouTube honest CONFIGURATION_REQUIRED until Google app verification
