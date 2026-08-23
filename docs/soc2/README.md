# SOC 2 Evidence Pack Templates

These templates map SUPERIOR AI controls to common SOC 2 Trust Services Criteria (Security, Availability, Confidentiality, Processing Integrity, Privacy).

**Not a certification.** Use with your auditor / GRC tool. Fill `[BRACKET]` fields with org-specific evidence.

| Doc | Purpose |
|-----|---------|
| [CC1_Control_Environment.md](./CC1_Control_Environment.md) | Governance, roles, policies |
| [CC6_Logical_Access.md](./CC6_Logical_Access.md) | Auth, secrets, RBAC |
| [CC7_System_Operations.md](./CC7_System_Operations.md) | Monitoring, incidents, changes |
| [CC8_Change_Management.md](./CC8_Change_Management.md) | Deploy, CI, approvals |
| [A1_Availability.md](./A1_Availability.md) | Capacity, failover, backups |
| [Evidence_Index.csv](./Evidence_Index.csv) | Tracker for artifacts |

## Quarterly checklist

1. Export audit logs (`GET /api/audit`) for the period  
2. Screenshot `/api/health` + `/status`  
3. Confirm encryption keys rotated / access reviewed  
4. Review provider BYOK access list  
5. Verify backup restore test date  
6. Attach CI run URLs for production releases  
