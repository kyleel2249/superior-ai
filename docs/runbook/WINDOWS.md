# Running SUPERIOR AI on Windows (npm)

## Requirements

| Tool | Notes |
|------|--------|
| **Node.js 20+** | https://nodejs.org — LTS recommended |
| **npm 10+** | Bundled with Node |
| **Git** | Optional; needed only for ALLOW_REPO_CLONE=1 |
| **Python 3** | Optional; only if ALLOW_CODE_EXEC=1 for Python |
| **PostgreSQL / Redis** | Optional; in-process fallbacks without them |

## Quick start

```bat
cd superior-ai
copy .env.example .env
npm install
npm run dev:web
```

Open http://localhost:3000

## Scripts

| Command | Purpose |
|---------|---------|
| npm run dev:web | Start Next.js (recommended on Windows) |
| npm run build:web | Production build |
| npm start | Production server |
| npm run smoke | Node smoke tests |
| npm run db:generate | Prisma generate |
| npm run db:push | Push schema when Postgres available |
| npm run worker | Background worker |

## PowerShell

```powershell
Copy-Item .env.example .env
npm install
npm run dev:web
```

If scripts are blocked: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

## Notes

- Next.js loads `.env` on Windows automatically.
- Use `PYTHON_PATH=python` or full path to python.exe if enabling code exec.
- Prefer `npm run dev:web` if turbo multi-dev is flaky in some terminals.
- Enable Windows long paths or clone near `C:\\src\\superior-ai` if path-length errors occur.
