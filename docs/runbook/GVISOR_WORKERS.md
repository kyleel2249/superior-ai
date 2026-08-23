# gVisor / Firecracker Worker Isolation

## Why

`POST /api/exec` with `ALLOW_CODE_EXEC=1` uses a **process sandbox** (timeout, cwd isolation, blocked patterns, stripped env). That is **not** kernel-level isolation.

For untrusted or multi-tenant code:

| Runtime | Isolation | Typical use |
|---------|-----------|-------------|
| Process sandbox (current) | Low | Trusted internal scripts |
| **gVisor (runsc)** | Strong user-space kernel | Containers with hostile workloads |
| **Firecracker microVM** | Strong VM boundary | Highest isolation / multi-tenant exec |
| Kata Containers | VM per pod | K8s-native middle ground |

## Recommended architecture

```
API (validate-only)  →  Queue (code_exec job)  →  Worker pool (gVisor/Firecracker)
                              ↓
                         Result object store / Redis
```

1. **API nodes**: never set `ALLOW_CODE_EXEC=1`. Only validate + enqueue.  
2. **Worker nodes**: run under gVisor or Firecracker; pull jobs; return stdout/stderr/exit.  
3. **Network**: default deny egress from exec workers (except package mirrors if required).  
4. **Filesystem**: ephemeral disk; wipe after each job (already done in process sandbox).  
5. **Secrets**: do not mount provider API keys into exec workers.

## gVisor (runsc) — outline

### Install (Linux worker)

```bash
# Example — follow current gVisor install docs for your distro
# https://gvisor.dev/docs/user_guide/install/

# Configure Docker/containerd runtime
# /etc/docker/daemon.json
{
  "runtimes": {
    "runsc": {
      "path": "/usr/local/bin/runsc"
    }
  }
}
```

### Worker container

```dockerfile
# Dockerfile.worker-gvisor (conceptual)
FROM node:22-alpine
WORKDIR /app
COPY packages ./packages
# ... install deps
ENV SUPERIOR_WORKER=1
ENV ALLOW_CODE_EXEC=1
ENV CODE_SANDBOX_ROOT=/tmp/code-sandbox
CMD ["npx", "tsx", "packages/queue/src/worker.ts"]
```

Run with:

```bash
docker run --runtime=runsc --rm \
  -e REDIS_URL=... \
  -e ALLOW_CODE_EXEC=1 \
  -e SUPERIOR_WORKER=1 \
  superior-ai-worker:gvisor
```

### Kubernetes

```yaml
# snippet — RuntimeClass
apiVersion: node.k8s.io/v1
kind: RuntimeClass
metadata:
  name: gvisor
handler: runsc
---
# Worker Deployment
spec:
  template:
    spec:
      runtimeClassName: gvisor
      containers:
        - name: worker
          env:
            - name: ALLOW_CODE_EXEC
              value: "1"
            - name: SUPERIOR_WORKER
              value: "1"
```

## Firecracker — outline

- Use **firecracker-containerd** or a job runner (e.g. AWS Lambda-style microVMs, Fly machines, or custom agent).  
- Boot microVM per job or small pool; pass code via vsock/virtio-blk.  
- Tear down VM after job → stronger cleanup than process sandbox.  
- Prefer for **public marketplace** code packs that execute user-provided logic.

## Job contract (queue)

```json
{
  "type": "code_exec",
  "payload": {
    "language": "javascript",
    "code": "...",
    "timeoutMs": 5000,
    "organizationId": "org_...",
    "requestId": "req_..."
  }
}
```

Worker handler should call the same `executeCode({ execute: true })` **only** inside the isolated runtime, then store result keyed by `requestId`.

## Security checklist

- [ ] API has `ALLOW_CODE_EXEC=0`  
- [ ] Workers have no cloud metadata access (IMDSv2 hop limit / block 169.254.169.254)  
- [ ] No host Docker socket mount  
- [ ] Seccomp + read-only root where possible  
- [ ] Max concurrency per org  
- [ ] Audit every exec (`tool.execute`)  
- [ ] Rate limit enqueue path  

## SUPERIOR AI defaults today

| Component | Setting |
|-----------|---------|
| `/api/exec` without `execute:true` | Validate only |
| `ALLOW_CODE_EXEC` unset/0 | Never runs code |
| Blocked patterns | Network, shell, env, destructive FS |
| Timeout | ≤ 15s hard cap |
| This doc | Path to production isolation |

## Related

- `packages/tools/src/code-exec.ts`  
- `docs/runbook/PRODUCTION.md`  
- Queue: `packages/queue` · `Dockerfile.worker`
