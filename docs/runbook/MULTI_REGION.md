# Multi-Region Failover Playbook

## Targets (set per contract)
- RTO ≤ 30 min | RPO ≤ 5 min | Status update ≤ 15 min

## Failover (A → B)
1. Declare incident; update /status
2. Stop writers in A
3. Promote DB in B; update DATABASE_URL
4. Point Redis to B; update REDIS_URL
5. Scale Helm in B
6. DNS failover
7. Verify health, login, orchestrate, queue
8. Communicate

## Failback
Resync A from B → maintenance window → DNS to A.

## Provider note
Model failover is independent of cloud region (router health).

## Drills
Tabletop quarterly; technical semi-annual.
