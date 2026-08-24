# PHASE 13 — Vector & Professional Design Studio

**Status:** VERIFIED — **LOCKED**

## Package `@superior-ai/design`

| Capability | Module |
|------------|--------|
| Pen / nodes / curves / bezier | `path.ts` |
| Boolean ops (union/intersect/subtract/exclude) | `boolean.ts` (SVG approximation; geometry engine pluggable) |
| Gradients & patterns | document model + SVG defs |
| Text on path | `textPath` nodes |
| Symbols / instances | `symbol` + `use` |
| Design systems | `createBrandDesignSystem` |
| SVG export | `documentToSvg` |

## API

```http
POST /api/design { "action": "brand_system", "brandName": "SUPERIOR AI" }
POST /api/design { "action": "bezier", "points": [{"x":0,"y":0},{"x":50,"y":80}] }
POST /api/design { "action": "boolean", "op": "union", "pathA": "M...", "pathB": "M..." }
```

## Note

CAD-grade boolean geometry can replace the SVG clip/evenodd approximations without changing the document API.

## Acceptance

```text
node scripts/phase13-design.test.mjs → passed
```

## Next

**Phase 14 — Video & Cinematic Studio**
