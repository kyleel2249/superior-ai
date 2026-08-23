# CC6 — Logical Access

## Control statement
Logical access is restricted through authentication, authorization, and secret management.

## How addressed in product
- JWT sessions (`AUTH_SECRET`) + httpOnly `superior_session` cookie
- OIDC + JWKS validation path (`jose` when installed)
- Provider/CRM keys: BYOK, encryption at rest (`ENCRYPTION_KEY`, AES-256-GCM)
- Rate limiting on auth and API routes

## Evidence to collect
| ID | Artifact | Owner | Location |
|----|----------|-------|----------|
| CC6-1 | Access review (users/roles) | [ADMIN] | [EXPORT] |
| CC6-2 | Secret rotation log | [SRE] | Vault / sealed-secrets |
| CC6-3 | OIDC IdP config (issuer, app) | [IT] | [IdP] |
| CC6-4 | Sample encrypted key fingerprint (not plaintext) | [ENG] | `/api/secrets` status |
| CC6-5 | Failed login / 401 samples from audit | [SEC] | `/api/audit?action=auth` |

## Test procedure
1. Login → cookie httpOnly.  
2. Logout → token revoked.  
3. Decrypt secret without `ENCRYPTION_KEY` → fail.  
4. API without session on protected audit in production → 401.  

## Period
[START_DATE] – [END_DATE]
