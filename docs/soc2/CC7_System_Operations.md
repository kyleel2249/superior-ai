# CC7 — System Operations

## Control statement
System operations are monitored; anomalies and incidents are detected and responded to.

## How addressed in product
- `GET /api/health` — provider + capacity status
- `GET /api/metrics` — spans, counters
- OTLP export when `OTEL_EXPORTER_OTLP_ENDPOINT` set
- Audit log stream (`AUDIT_LOG_STDOUT=1` for SIEM ship)
- Public `/status` page

## Evidence to collect
| ID | Artifact | Owner | Location |
|----|----------|-------|----------|
| CC7-1 | Monitoring dashboards | [SRE] | Grafana / [LINK] |
| CC7-2 | Alert rules (health, error rate, budget) | [SRE] | [LINK] |
| CC7-3 | Incident tickets for period | [SRE] | [TICKET_SYSTEM] |
| CC7-4 | Audit export for period | [SEC] | `/api/audit` |

## Test procedure
1. Force provider key missing → health shows CONFIGURATION_REQUIRED / degraded.  
2. Confirm metrics endpoint returns data after orchestrate call.  

## Period
[START_DATE] – [END_DATE]
