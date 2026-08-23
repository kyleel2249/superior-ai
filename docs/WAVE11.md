# Wave 11

## Signed packs
- HS256 platform signing + optional Ed25519
- `verifyPackSignature` / `publishPack` / `installPackVerified`
- Pack API: publish, verify, install with signature

## Repo sandbox
- `repo_list` / `repo_read` / `repo_clone` under REPO_SANDBOX_ROOT
- Path traversal blocked; clone opt-in (`ALLOW_REPO_CLONE=1`)
- Localhost/metadata URLs blocked
- `GET/POST /api/repo`

## Pack billing
- Map add-on packs → Stripe prices (`PACK_PRICE_JSON`)
- `action: checkout` on `/api/packs`
- Buy button on `/admin/packs`
