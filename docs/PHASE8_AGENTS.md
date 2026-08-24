# PHASE 8 — Core Agent Framework

**Status:** VERIFIED — **LOCKED**

## Agent definition fields

Role · Instructions (systemPrompt) · Tools · Preferred models · Permissions · Goals/KPIs (runtime) · Output rules (in prompts)

## Framework modules (`packages/agents/src/framework`)

| Module | Responsibility |
|--------|----------------|
| `permissions` | Capability checks |
| `message-bus` | Agent-to-agent messages + inbox |
| `task-manager` | create · assign · start · complete · fail · retry · escalate |
| `runtime` | Instances, use tool, use memory, call agent, run task |
| `scheduler` | Priority FIFO job queue |

## Lifecycle

```text
created → idle → busy → idle | error | stopped
```

## Task status

pending → assigned → running → completed | failed | retrying | escalated

## API

```http
GET  /api/agents
POST /api/agents { "action": "create" | "run" | "assign" | "complete" | "fail" | "retry" | "escalate" | "message" | "use_tool" | "use_memory" | "call_agent" | "schedule" }
```

## Acceptance scenarios covered

- Create agent instance  
- Assign task  
- Use tool / memory  
- Call another agent (message bus)  
- Complete / fail / retry / escalate  

## Acceptance

```text
node scripts/phase8-agents.test.mjs → 40 passed, 0 failed
```

## Next

**Phase 9 — Expert Departments & AI Company**
