# Wave 9

## SOC 2 evidence pack
- `docs/soc2/` — CC1, CC6, CC7, CC8, A1 templates + Evidence_Index.csv

## Multi-region failover
- `docs/runbook/MULTI_REGION.md` — RTO/RPO, detection, failover/failback, drills

## Public status page
- `/status` + `GET/POST /api/status`
- Auto-probe from env (DB, Redis, providers)
- Admin incident/component updates

## Cost attribution
- By meter, model, provider, project, user
- `/settings/costs` UI + billing API `attribution=1`
