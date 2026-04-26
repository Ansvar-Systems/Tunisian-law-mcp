# Tunisia Law MCP Server -- Developer Guide

## Git Workflow

- **Never commit directly to `main`.** Always create a feature branch and open a Pull Request.
- Branch protection requires: verified signatures, PR review, and status checks to pass.
- Use conventional commit prefixes: `feat:`, `fix:`, `chore:`, `docs:`, etc.

## Project Overview

Tunisia Law MCP server providing Tunisian legislation search via Model Context Protocol. Corpus is quarantined as of 2026-04-26; the MCP boots and registers the standard tool surface, but search returns no results until Phase 4 backfill from clean primary sources.

## Architecture

- **Transport:** stdio (npm package)
- **Database:** SQLite + FTS5 via `@ansvar/mcp-sqlite` (WASM-compatible, no WAL mode)
- **Entry point:** `src/index.ts` (stdio)
- **Tool registry:** `src/tools/registry.ts`
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
- Journal mode: DELETE (not WAL -- required for WASM SQLite compatibility)
- Metadata: `db_metadata` table stores tier, schema_version, built_at, builder

## Data Pipeline (quarantined)

The previous pipeline (census -> ingest -> build-db) was withdrawn under the Red MCP Legal
Remediation program. `scripts/ingest.ts` is now a quarantine stub that exits non-zero.

To restore the pipeline:
1. Declare a vetted source in `sources.yml` with documented reuse rights.
2. Implement a new ingestion script targeting the vetted source.
3. Replace the quarantine stub in `scripts/ingest.ts`.

Backfill candidates under evaluation:
- JORT (Journal Officiel de la Republique Tunisienne) -- https://www.iort.gov.tn/
- JuriCAF Tunisia -- https://juricaf.org/ (Tunisian coverage to be verified)

## Tunisia-Specific Notes

- Tunisia uses a **civil law system** based on the French model
- The **Constitution of 2022** is the current supreme law (replacing the 2014 constitution)
- Tunisia is bilingual: Arabic (official) + French (administrative/legal)
- Articles are called "الفصل" (fasl) in Arabic, "Article" in French -- NOT "المادة"
- Legislation hierarchy: Constitution > Organic Laws > Laws > Decree-Laws > Decrees > Orders
- Citations follow: "الفصل N من القانون عدد XX لسنة YYYY" or "Article N, Loi n YYYY-XX"
- "مجلة" (majalla) = Code (codified collection of laws)
- The INPDP (Instance Nationale de Protection des Donnees Personnelles) is the data protection authority
- The 2004 Data Protection Law (Loi 2004-63) predates EU GDPR; update expected
- The ANSI (Agence Nationale de la Securite Informatique) oversees cybersecurity under Law 2004-5

## Deployment

- npm package: `@ansvar/tunisian-law-mcp` with bin entry for stdio transport
- No Vercel deployment (decommissioned as part of the 2.0.0 scrub)
