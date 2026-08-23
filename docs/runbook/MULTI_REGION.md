# Multi-Region Failover Playbook

## Objectives

| Metric | Target (example — set per contract) |
|--------|--------------------------------------|
| RTO (app) | ≤ 30 minutes |
| RPO (DB) | ≤ 5 minutes (async replica) or 0 (sync, higher latency) |
| Status communication | Update `/status` + status page within 15 minutes |

## Regions (template)

| Role | Region | Cluster | Notes |
|------|--------|---------|-------|
| Primary | [REGION_A] e.g. us-east-1 | [CLUSTER_A] | Active traffic |
| Secondary | [REGION_B] e.g. us-west-2 | [CLUSTER_B] | Warm standby |
| Tertiary | [REGION_C] optional | — | DNS-only / cold |

## Dependencies

1. **Postgres** — primary + streaming replica in secondary (or managed multi-AZ / multi-region)  
2. **Redis** — primary + replica or Redis Enterprise / Memorystore multi-region  
3. **Object storage** — cross-region replication for assets  
4. **Secrets** — replicated via vault / external-secrets in both clusters  
5. **DNS / LB** — weighted or failover records (Route53, Cloudflare, etc.)

## Normal state

- Traffic 100% → Region A  
- Workers process queue in Region A  
- Region B runs web+worker at reduced replicas (or scale-to-zero with images warm)  
- Health: `GET https://app.example.com/api/health`

## Failure detection

Trigger failover when **two** of the following hold for > 5 minutes:

- `/api/health` fails from external probes  
- Synthetic orchestrate check fails  
- Postgres primary unreachable  
- Error rate > threshold on critical routes  

## Failover steps (Region A → B)

1. **Declare incident** — page on-call; set status component to *degraded* / *outage* via status API or admin.  
2. **Stop writers in A** (if partial failure) — scale web/worker to 0 to avoid split-brain.  
3. **Promote DB** in B (follow managed provider promote procedure). Update `DATABASE_URL`.  
4. **Point Redis** to B primary (or promote replica). Update `REDIS_URL`.  
5. **Scale up** Helm release in B: `helm upgrade superior ./deploy/helm/superior-ai --set replicaCount=N`.  
6. **DNS failover** — lower TTL beforehand (300s); switch record to B LB.  
7. **Verify** — `/status`, `/api/health`, login, one orchestrate job, one queue job.  
8. **Communicate** — status page *operational* or *partial outage* with ETA.  

## Failback

1. Ensure A recovered; resync DB (rebuild replica from B).  
2. Maintenance window: drain B writers → repoint DNS to A → scale A up → scale B down.  
3. Post-incident review within 5 business days.

## Model / provider continuity

SUPERIOR AI is **provider-agnostic**: during regional cloud failure, application failover is independent of OpenAI/Anthropic/etc. If a *provider* region fails, router health marks models unavailable and selects fallbacks — no DNS change required.

## Drill schedule

- Tabletop: quarterly  
- Technical failover (non-prod): semi-annual  
- Document results under SOC2 A1 evidence  

## Contacts

| Role | Contact |
|------|---------|
| On-call | [PAGER] |
| DB owner | [DBA] |
| Comms | [COMMS] |
