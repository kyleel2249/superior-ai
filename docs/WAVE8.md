# Wave 8

## jose JWKS
- Dynamic `jose` for RS256 jwtVerify + remote JWKS
- Claims-only fallback
- OIDC callback validates ID token

## Redis rate limit
- INCR + EXPIRE via ioredis
- Memory fallback

## OTLP
- POST {endpoint}/v1/traces

## Audit
- Ring buffer + stdout JSON
- GET/POST /api/audit

## CI
- prisma generate + db push
