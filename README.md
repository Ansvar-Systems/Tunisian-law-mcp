# Tunisian Law MCP Server

> **Status — 2026-04-26: corpus quarantined.** This MCP boots and registers the standard MCP tool surface, but search returns no results. Previous data was withdrawn under the Red MCP Legal Remediation program; clean primary sources are being evaluated for backfill. See `sources.yml`, `DISCLAIMER.md`, and `CHANGELOG.md` for context.

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

An MCP server for Tunisian legislation, maintained by [Ansvar Systems](https://ansvar.eu).

---

## Status

This package is in scheduled quarantine. The data layer has been removed pending Phase 4 backfill from official primary sources. Code, schema, tools, and CI are intact; the `data/database.db` shipped with this package is empty.

**Phase 4 backfill candidates under evaluation:**
- JORT — Journal Officiel de la Republique Tunisienne — `https://www.iort.gov.tn/`
- JuriCAF Tunisia — `https://juricaf.org/` (francophone case law aggregator; Tunisian coverage to be verified)

A future minor or major version will restore coverage once a clean source has been ingested and rights-cleared.

---

## Install

```bash
npm install -g @ansvar/tunisian-law-mcp
```

This installs an MCP server that registers the standard Tunisian Law tool surface (`search_legislation`, `get_provision`, etc.) but returns zero results from every query while the corpus is empty.

If your client expects non-empty results during this period, configure it to skip `eu.ansvar/tunisian-law-mcp` until coverage is restored.

---

## Tools

The server exposes the same tool surface as other Ansvar law MCPs. See `TOOLS.md` for the full list. While the corpus is empty, every search tool returns an empty result set; lookup tools (`get_provision`, etc.) return a not-found error for any document id.

---

## Development

```bash
git clone https://github.com/Ansvar-Systems/Tunisian-law-mcp.git
cd Tunisian-law-mcp
npm install
npm run build
npm test
```

The build produces an empty MCP server. To prepare for a new corpus ingestion, populate `sources.yml` with a vetted source declaration and add seed records under `data/seed/`; do not point the ingestion script at any commercial or third-party legal publisher without prior recorded rights evidence.

---

## License

Apache 2.0. See `LICENSE`.

The MCP code is open-source and may be reused under those terms. No bundled legal content is shipped with this package while the corpus is quarantined.
