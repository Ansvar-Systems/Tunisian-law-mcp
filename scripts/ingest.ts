#!/usr/bin/env tsx
/**
 * Tunisia Law MCP — Ingestion (QUARANTINED 2026-04-26)
 *
 * The previous ingestion pipeline was withdrawn under the Red MCP Legal
 * Remediation program. This stub exists to fail loudly if anyone runs
 * `npm run ingest` against a stale checkout or attempts to re-introduce
 * the previous source without rights review.
 *
 * Re-enabling ingestion requires:
 *   1. A vetted source declared in sources.yml with documented reuse rights.
 *   2. A new ingestion pipeline that targets the vetted source.
 *   3. Removal or replacement of this stub.
 *
 * See:
 *   - sources.yml (current source declarations — empty during quarantine)
 *   - DISCLAIMER.md (legal context)
 *   - CHANGELOG.md 2.0.0 entry
 */

console.error('[ingest] corpus is quarantined as of 2026-04-26.');
console.error('[ingest] Re-enabling ingestion requires a vetted source declaration in sources.yml');
console.error('[ingest] and a new ingestion pipeline. See README.md and CHANGELOG.md.');
process.exit(1);
