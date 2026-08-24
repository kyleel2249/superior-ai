# PHASE 6 — File, Document & Multimodal Intelligence

**Status:** VERIFIED — **LOCKED**  
**Depends on:** Phase 1, Phase 3 (vision/ASR keys optional)

## Package

`@superior-ai/documents`

## Supported kinds

| Kind | Method | Notes |
|------|--------|-------|
| txt / md | utf8 | Full |
| csv | table extract | Headers + rows |
| json | parse | Structured |
| html | strip tags | Text only |
| pdf | heuristic streams | Low yield on scans → OCR warning |
| docx / xlsx / pptx | OOXML text scan | Best-effort without full ZIP lib |
| image | vision provider | CONFIGURATION_REQUIRED without key |
| audio | ASR adapter | Whisper-compatible when keyed |
| video | adapter | Frame+ASR pipeline; no fake transcripts |

## API

```http
GET  /api/documents
POST /api/documents { "action": "parse", "content": "...", "filename": "a.csv" }
POST /api/documents { "action": "detect", "filename": "x.pdf" }
POST /api/documents { "action": "analyze", "filename": "shot.png", "base64": "..." }
POST /api/documents { "action": "compare", "documents": [{...},{...}] }
POST /api/documents { "action": "multi", "documents": [...] }
```

## Tools

- `document_parse`
- `multimodal_analyze`

## Confidence & honesty

Every result includes `confidence` and `warnings`.  
Scanned PDFs do not invent OCR text.  
Audio/video do not invent transcripts without providers.

## Acceptance

```text
node scripts/phase6-documents.test.mjs → 29 passed, 0 failed
```

## Next

**Phase 7 — Internet Search, Browser & Deep Research**
