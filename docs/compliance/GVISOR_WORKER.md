# gVisor worker notes

**Status:** Documented (not bundled)

## Why

Untrusted `code_exec` should not share the host kernel freely. gVisor (`runsc`) provides user-space kernel isolation for containers.

## Recommended path

1. Linux worker pool with Docker/containerd + `runsc`
2. Job image: minimal Node/Python, non-root
3. No network; capped CPU/memory
4. Mount only ephemeral workspace
5. Health-check `runsc` before accepting jobs
6. Fall back to dry-run if runtime missing

## Local / Windows

Use dry-run or remote Linux workers. gVisor is not native on Windows.

## Env

```bash
ALLOW_CODE_EXEC=0          # default safe
SANDBOX_TIER=process       # or gvisor when workers ready
CODE_EXEC_TIMEOUT_MS=15000
```
