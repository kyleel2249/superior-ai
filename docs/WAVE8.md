# Wave 8

## jose JWKS
- Dynamic import of `jose` for RS256 `jwtVerify` + remote JWKS
- Claims-only fallback when jose not installed
- OIDC callback validates ID token before session

## Redis rate limit
- `rateLimitDistributed` via ioredis INCR + EXPIRE
- Falls back to memory token bucket

## OTLP
- Buffer spans → POST `{endpoint}/v1/traces`
- `OTEL_EXPORTER_OTLP_ENDPOINT`

## Audit log
- Append-only ring + optional stdout JSON
- `GET/POST /api/audit`
- Auth login events recorded

## CI
- `prisma generate` + `db push` after pgvector SQL
