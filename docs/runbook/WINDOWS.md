# Running SUPERIOR AI on Windows (npm)

## Requirements

| Tool | Notes |
|------|--------|
| **Node.js 20+** | https://nodejs.org — LTS recommended |
| **npm 10+** | Bundled with Node |
| **Git** | Optional; needed only for `ALLOW_REPO_CLONE=1` |
| **Python 3** | Optional; only if you enable `ALLOW_CODE_EXEC=1` for Python |
| **PostgreSQL** | Optional; memory falls back to in-process without `DATABASE_URL` |
| **Redis** | Optional; queue falls back without `REDIS_URL` |

Docker Desktop is optional (for Postgres/Redis containers).

## Quick start (npm only)

```bat
cd superior-ai
copy .env.example .env
```

Edit `.env` in Notepad (set at least `AUTH_SECRET` and ideally `OPENROUTER_API_KEY`).

```bat
npm install
npm run dev:web
```

Open http://localhost:3000

### Useful scripts

| Command | Purpose |
|---------|---------|
| `npm run dev:web` | Start Next.js web app (recommended on Windows) |
| `npm run build:web` | Production build |
| `npm start` | Start production server after build |
| `npm run smoke` | Structural smoke tests (Node only) |
| `npm run db:generate` | Prisma client generate |
| `npm run db:push` | Push schema when Postgres is available |
| `npm run worker` | Background worker process |

## Environment file

Windows does not expand env vars the same way as bash. Prefer a root `.env` file:

```
NEXT_PUBLIC_APP_URL=http://localhost:3000
AUTH_SECRET=change-me-to-a-long-random-string
OPENROUTER_API_KEY=your-key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

Next.js loads `.env` automatically on Windows.

Optional:

```
DATABASE_URL=postgresql://superior:superior@localhost:5432/superior_ai?schema=public
REDIS_URL=redis://localhost:6379
PYTHON_PATH=python
ALLOW_CODE_EXEC=0
ALLOW_REPO_CLONE=0
```

## PowerShell notes

```powershell
cd C:\path\to\superior-ai
Copy-Item .env.example .env
npm install
npm run dev:web
```

If execution policy blocks scripts:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

## Common Windows issues

### `EPERM` / file locks
Close editors locking `node_modules`, delete `node_modules` and run `npm install` again.

### `prisma` not found
```bat
npm run db:generate
```

### Port 3000 in use
```bat
npm run dev --workspace=@superior-ai/web -- --port 3001
```

### Long paths
Enable Windows long paths, or clone the repo near `C:\src\superior-ai`.

### Turbo / workspace
Use `npm run dev:web` if `turbo run dev` hangs on some Windows terminals.

### Python for code exec
Install Python from python.org and ensure `python` is on PATH, or set `PYTHON_PATH=C:\Path\to\python.exe`.

## Without Docker

The app runs on Windows with **only Node + npm**:

- Chat / packs / brand / memory (in-process) work without Postgres
- Durable memory needs Postgres (`DATABASE_URL`)
- Queue workers need Redis for multi-process durability

## Verify

```bat
npm run smoke
curl http://localhost:3000/api/health
```

Or open http://localhost:3000/workspace in a browser.
