# Wave 13

## gVisor worker notes
- `docs/runbook/GVISOR_WORKERS.md`
- Architecture: API validate-only → queue → isolated workers
- Docker RuntimeClass + K8s snippets
- Firecracker alternative
- Security checklist

## Marketplace ranking
- Score: verified, featured, installs, ratings, recency, pricing
- `GET /api/packs?ranked=1`
- Actions: `rate`, `feature`; install increments metrics
- Admin UI rank badges + reasons
