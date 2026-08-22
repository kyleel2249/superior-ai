# gVisor / Firecracker Worker Isolation

## Why
Process sandbox (ALLOW_CODE_EXEC) is not kernel isolation. Use gVisor (runsc) or Firecracker for untrusted multi-tenant code.

## Architecture
API (validate-only, ALLOW_CODE_EXEC=0) → Queue code_exec job → Worker pool under gVisor/Firecracker → results to Redis/object store.

## gVisor
- Install runsc; Docker runtime `runsc` or K8s RuntimeClass `handler: runsc`
- Worker env: SUPERIOR_WORKER=1, ALLOW_CODE_EXEC=1
- No host Docker socket; block metadata IPs; audit every exec

## Firecracker
- Stronger VM boundary per job; preferred for public marketplace exec

## Checklist
- [ ] API ALLOW_CODE_EXEC=0
- [ ] Workers isolated runtime
- [ ] No secrets in exec env
- [ ] Egress default deny
- [ ] Org concurrency limits
- [ ] Audit tool.execute

See packages/tools/src/code-exec.ts and Dockerfile.worker.
