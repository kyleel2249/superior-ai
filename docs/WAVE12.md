# Wave 12

## Publisher portal
- `/publisher` UI — register, publish signed pack, revenue share
- `/api/publishers` — register, link_pack, publish_pack, record_sale

## Code execution sandbox
- Validate-only by default
- `ALLOW_CODE_EXEC=1` + `execute:true` for process sandbox (timeout, no secrets, blocked patterns)
- Explicitly not gVisor/Firecracker yet
- `POST /api/exec`

## Revenue share
- Publisher accounts with shareBps (default 70%)
- Accrue platform vs publisher split on pack sales
