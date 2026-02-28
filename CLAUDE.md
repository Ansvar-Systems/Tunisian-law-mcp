# Tunisia Law MCP Server -- Developer Guide

## Git Workflow

- **Never commit directly to `main`.** Always create a feature branch and open a Pull Request.
- Branch protection requires: verified signatures, PR review, and status checks to pass.
- Use conventional commit prefixes: `feat:`, `fix:`, `chore:`, `docs:`, etc.

## Project Overview

Tunisia Law MCP server providing Tunisian legislation search via Model Context Protocol. Strategy A deployment (Vercel, bundled SQLite DB). Covers constitution, codes (penal, civil, commercial, labor, tax, etc.), data protection, cybersecurity, e-commerce, banking, environment, and sector-specific laws.

## Architecture

- **Transport:** Dual-channel -- stdio (npm package) + Streamable HTTP (Vercel serverless)
- **Database:** SQLite + FTS5 via `@ansvar/mcp-sqlite` (WASM-compatible, no WAL mode)
- **Entry points:** `src/index.ts` (stdio), `api/mcp.ts` (Vercel HTTP)
- **Tool registry:** `src/tools/registry.ts` -- shared between both transports
- **Capability gating:** `src/capabilities.ts` -- detects available DB tables at runtime

## Key Conventions

- All database queries use parameterized statements (never string interpolation)
- FTS5 queries go through `buildFtsQueryVariants()` with primary + fallback strategy
- FTS5 uses `tokenize='unicode61'` for Arabic text support
- User input is sanitized via `sanitizeFtsInput()` before FTS5 queries
- Every tool returns `ToolResponse<T>` with `results` + `_metadata` (freshness, disclaimer)
- Tool descriptions are written for LLM agents -- explain WHEN and WHY to use each tool
- Capability-gated tools only appear in `tools/list` when their DB tables exist
- Tunisia uses "الفصل N" (Article N) for articles in Arabic, "Article N" in French texts

## Testing

- Unit tests: `tests/` (vitest, in-memory SQLite fixtures)
- Contract tests: `__tests__/contract/golden.test.ts` with `fixtures/golden-tests.json`
- Nightly mode: `CONTRACT_MODE=nightly` enables network assertions
- Run: `npm test` (unit), `npm run test:contract` (golden), `npm run validate` (both)

## Database

- Schema defined inline in `scripts/build-db.ts`
- Journal mode: DELETE (not WAL -- required for Vercel serverless)
- Runtime: copied to `/tmp/database.db` on Vercel cold start
- Metadata: `db_metadata` table stores tier, schema_version, built_at, builder

## Data Pipeline

1. `scripts/census.ts` -> enumerates all discoverable Tunisian laws -> `data/census.json`
2. `scripts/ingest.ts` -> fetches from jurisitetunisie.com + legislation.tn -> JSON seed files in `data/seed/`
3. `scripts/build-db.ts` -> seed JSON -> SQLite database in `data/database.db`
4. `scripts/drift-detect.ts` -> verifies upstream content hasn't changed

## Data Sources

- **Primary:** jurisitetunisie.com (33+ codes in structured French HTML)
- **Fallback:** legislation.tn (official government portal, often inaccessible)
- **Supplementary:** africa-laws.org, FAOLEX, ILO NATLEX (sector laws)
- **License:** Government Publication (public domain)
- **Languages:** Arabic (ar) is the official language; French (fr) is the administrative/legal language
- **Coverage:** Constitution, 33 major codes, 40+ individual laws, decrees, and decree-laws

## Tunisia-Specific Notes

- Tunisia uses a **civil law system** based on the French model
- The **Constitution of 2022** is the current supreme law (replacing the 2014 constitution)
- Tunisia is bilingual: Arabic (official) + French (administrative/legal)
- Articles are called "الفصل" (fasl) in Arabic, "Article" in French -- NOT "المادة"
- Legislation hierarchy: Constitution > Organic Laws > Laws > Decree-Laws > Decrees > Orders
- Citations follow: "الفصل N من القانون عدد XX لسنة YYYY" or "Article N, Loi n YYYY-XX"
- "مجلة" (majalla) = Code (codified collection of laws)
- The INPDP (Instance Nationale de Protection des Données Personnelles) is the data protection authority
- The 2004 Data Protection Law (Loi 2004-63) predates EU GDPR; update expected
- The ANSI (Agence Nationale de la Sécurité Informatique) oversees cybersecurity under Law 2004-5

## Deployment

- Vercel Strategy A: DB bundled in `data/database.db`, included via `vercel.json` includeFiles
- npm package: `@ansvar/tunisian-law-mcp` with bin entry for stdio
