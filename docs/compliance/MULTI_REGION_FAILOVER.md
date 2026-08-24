# Multi-region failover playbook (template)

1. Health check `/api/health` fails in primary region  
2. Route DNS / load balancer to secondary  
3. Promote read-replica DB if configured  
4. Drain workers; resume queue consumers in secondary  
5. Verify `/api/status` components  
6. Post incident on status page  
7. Rollback when primary healthy  

Requires infrastructure configuration — not automatic in local dev.
