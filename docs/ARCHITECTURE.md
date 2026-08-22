# SUPERIOR AI — Architecture

## Principles

1. **Model-agnostic core** — Registry + adapters + router. New model families are configuration, not rewrites.
2. **Honest availability** — AVAILABLE only after live validation. Future aliases remain UNAVAILABLE.
3. **Continuous capacity** — Failover chain: Provider A → B → C → secondary keys → lower-cost → local → queue.
4. **Durable tasks** — Checkpoint every meaningful stage; resume after disconnect/restart.
5. **Truthfulness** — Never invent tool results, citations, test outcomes, or deployment status.
6. **Approval gates** — Sensitive external actions require policy-driven confirmation.

## Package Map

| Package | Responsibility |
|---------|----------------|
| `@superior-ai/core` | Shared domain types |
| `@superior-ai/ai-gateway` | Providers, registry, router |
| `@superior-ai/agents` | AI Council definitions & selection |
| `@superior-ai/db` | Prisma schema & client |
| `@superior-ai/web` | Next.js UI + API routes |

## Extending

### Add a provider
1. Implement `BaseProviderAdapter` in `packages/ai-gateway/src/providers/`.
2. Register in `providers/index.ts`.
3. Seed models in `model-registry.ts` with `CONFIGURATION_REQUIRED`.
4. Document env vars in `.env.example`.

### Add an agent role
1. Extend `AgentRole` in core types.
2. Add definition to `COUNCIL_AGENTS`.
3. Update `selectCouncil` task-type mapping.

### Future models
Register with `status: "UNAVAILABLE"` and aliases. Router resolves to best available automatically when the real model is validated.

## Security notes

- Encrypt provider keys at rest (ProviderKey.encryptedKey).
- Sandbox all code execution.
- Instruction hierarchy + untrusted content labeling for prompt-injection resistance.
- Audit log for admin and sensitive actions.
