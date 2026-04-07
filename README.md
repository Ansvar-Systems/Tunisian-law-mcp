# Tunisian Law MCP Server

**The JORT (Journal Officiel de la République Tunisienne) alternative for the AI age.**

[![npm version](https://badge.fury.io/js/@ansvar%2Ftunisian-law-mcp.svg)](https://www.npmjs.com/package/@ansvar/tunisian-law-mcp)
[![MCP Registry](https://img.shields.io/badge/MCP-Registry-blue)](https://registry.modelcontextprotocol.io)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![GitHub stars](https://img.shields.io/github/stars/Ansvar-Systems/Tunisian-law-mcp?style=social)](https://github.com/Ansvar-Systems/Tunisian-law-mcp)
[![CI](https://github.com/Ansvar-Systems/Tunisian-law-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/Ansvar-Systems/Tunisian-law-mcp/actions/workflows/ci.yml)
[![Database](https://img.shields.io/badge/database-pre--built-green)](https://github.com/Ansvar-Systems/Tunisian-law-mcp)
[![Provisions](https://img.shields.io/badge/provisions-575-blue)](https://github.com/Ansvar-Systems/Tunisian-law-mcp)

Query **42 Tunisian statutes** -- from the Code pénal and Code civil to the Personal Data Protection Act, Labour Code, and more -- directly from Claude, Cursor, or any MCP-compatible client.

If you're building legal tech, compliance tools, or doing Tunisian legal research, this is your verified reference database.

Built by [Ansvar Systems](https://ansvar.eu) -- Stockholm, Sweden

---

## Why This Exists

Tunisian legal research means navigating legislation.tn, iort.gov.tn (Journal Officiel de la République Tunisienne), and jurisitetunisie.com across bilingual Arabic-French publications. Whether you're:
- A **lawyer** validating citations in a brief or contract
- A **compliance officer** checking obligations under Law No. 63 of 2004 on Personal Data Protection
- A **legal tech developer** building tools on Tunisian law
- A **researcher** tracing provisions across statutes in both Arabic and French

...you shouldn't need dozens of browser tabs and manual PDF cross-referencing. Ask Claude. Get the exact provision. With context.

This MCP server makes Tunisian law **searchable, cross-referenceable, and AI-readable**.

---

## Quick Start

### Use Remotely (No Install Needed)

> Connect directly to the hosted version -- zero dependencies, nothing to install.

**Endpoint:** `https://mcp.ansvar.eu/law-tn/mcp`

| Client | How to Connect |
|--------|---------------|
| **Claude.ai** | Settings > Connectors > Add Integration > paste URL |
| **Claude Code** | `claude mcp add tunisian-law --transport http https://mcp.ansvar.eu/law-tn/mcp` |
| **Claude Desktop** | Add to config (see below) |
| **GitHub Copilot** | Add to VS Code settings (see below) |

**Claude Desktop** -- add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "tunisian-law": {
      "type": "url",
      "url": "https://mcp.ansvar.eu/law-tn/mcp"
    }
  }
}
```

**GitHub Copilot** -- add to VS Code `settings.json`:

```json
{
  "github.copilot.chat.mcp.servers": {
    "tunisian-law": {
      "type": "http",
      "url": "https://mcp.ansvar.eu/law-tn/mcp"
    }
  }
}
```

### Use Locally (npm)

```bash
npx @ansvar/tunisian-law-mcp
```

**Claude Desktop** -- add to `claude_desktop_config.json`:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "tunisian-law": {
      "command": "npx",
      "args": ["-y", "@ansvar/tunisian-law-mcp"]
    }
  }
}
```

**Cursor / VS Code:**

```json
{
  "mcp.servers": {
    "tunisian-law": {
      "command": "npx",
      "args": ["-y", "@ansvar/tunisian-law-mcp"]
    }
  }
}
```

---

## Example Queries

Once connected, just ask naturally:

- *"البحث عن أحكام حماية البيانات الشخصية في القانون عدد 63 لسنة 2004"* (Search for personal data protection provisions in Law No. 63 of 2004)
- *"ما هي عقوبة الجرائم الإلكترونية في مجلة الإجراءات الجزائية؟"* (What are the penalties for cybercrime in the Code of Criminal Procedure?)
- *"البحث عن حقوق العمال في مجلة الشغل التونسية"* (Search for worker rights in the Tunisian Labour Code)
- *"Recherche dans le Code pénal tunisien les dispositions sur la protection des mineurs"*
- *"Que dit le Code civil tunisien sur les obligations contractuelles?"*
- *"Trouver les dispositions sur la protection des données personnelles (Loi n°2004-63)"*
- *"Is Law No. 2004-63 on Personal Data Protection still in force?"*
- *"Validate the citation 'Article 29, Loi n°2004-63'"*

---

## What's Included

| Category | Count | Details |
|----------|-------|---------|
| **Statutes** | 42 statutes | Key Tunisian legislation |
| **Provisions** | 575 sections | Full-text searchable with FTS5 |
| **Database Size** | ~1.2 MB | Optimized SQLite, portable |
| **Data Sources** | jurisitetunisie.com / legislation.tn | Official Tunisian legal publications |
| **Languages** | Arabic and French | Bilingual official statute texts |
| **Freshness Checks** | Automated | Drift detection against official sources |

**Verified data only** -- every citation is validated against official sources (JORT, legislation.tn). Zero LLM-generated content.

---

## See It In Action

### Why This Works

**Verbatim Source Text (No LLM Processing):**
- All statute text is ingested from legislation.tn and jurisitetunisie.com official publications
- Provisions are returned **unchanged** from SQLite FTS5 database rows
- Zero LLM summarization or paraphrasing -- the database contains statute text, not AI interpretations

**Smart Context Management:**
- Search returns ranked provisions with BM25 scoring (safe for context)
- Provision retrieval gives exact text by statute name and article number
- Cross-references help navigate without loading everything at once

**Technical Architecture:**
```
legislation.tn / jurisitetunisie.com --> Parse --> SQLite --> FTS5 snippet() --> MCP response
                                          ^                        ^
                                   Provision parser         Verbatim database query
```

### Traditional Research vs. This MCP

| Traditional Approach | This MCP Server |
|---------------------|-----------------|
| Search JORT by publication date | Search by plain language in Arabic or French |
| Navigate multi-article statutes manually | Get the exact provision with context |
| Manual cross-referencing between codes | `build_legal_stance` aggregates across sources |
| "Is this law still in force?" -- check manually | `check_currency` tool -- answer in seconds |
| Find EU alignment -- dig through EUR-Lex | `get_eu_basis` -- linked frameworks instantly |
| No API, no integration | MCP protocol -- AI-native |

**Traditional:** Browse JORT archives --> Locate publication --> Cross-reference codes --> Check EU Association Agreement --> Repeat

**This MCP:** *"What are Tunisia's personal data protection requirements and how do they align with GDPR?"* --> Done.

---

## Available Tools (13)

### Core Legal Research Tools (8)

| Tool | Description |
|------|-------------|
| `search_legislation` | FTS5 full-text search across 575 provisions with BM25 ranking. Supports Arabic and French queries |
| `get_provision` | Retrieve specific provision by statute name and article number |
| `validate_citation` | Validate citation against database -- zero-hallucination check |
| `build_legal_stance` | Aggregate citations from multiple statutes for a legal topic |
| `format_citation` | Format citations per Tunisian legal conventions (full/short/pinpoint) |
| `check_currency` | Check if a statute is in force, amended, or repealed |
| `list_sources` | List all available statutes with metadata and data provenance |
| `about` | Server info, capabilities, dataset statistics, and coverage summary |

### EU Law Integration Tools (5)

| Tool | Description |
|------|-------------|
| `get_eu_basis` | Get EU directives/regulations that a Tunisian statute aligns with |
| `get_tunisian_implementations` | Find Tunisian laws aligning with a specific EU act |
| `search_eu_implementations` | Search EU documents with Tunisian alignment counts |
| `get_provision_eu_basis` | Get EU law references for a specific provision |
| `validate_eu_compliance` | Check alignment status of Tunisian statutes against EU directives |

---

## EU Law Integration

Tunisia has an **EU Association Agreement** under the **Euro-Mediterranean Partnership** (the Euro-Mediterranean Agreement establishing an association between the European Communities and Tunisia, in force since March 1998). This creates a formal framework for regulatory alignment:

- **Law No. 2004-63 on Personal Data Protection** aligns with the EU Data Protection Directive (95/46/EC) and shares core GDPR principles -- consent, purpose limitation, data subject rights
- **Cybercrime provisions** reflect alignment with the Budapest Convention, which the EU has adopted across member states
- The **Labour Code** reflects ILO conventions adopted across EU member states
- Tunisia's Association Agreement includes provisions on movement of goods, services, and persons -- creating compliance overlap with EU trade and commercial law

The EU bridge tools allow you to explore these alignment relationships -- checking which Tunisian provisions correspond to EU requirements, and vice versa.

> **Note:** Tunisia is not an EU member state. EU cross-references reflect alignment and association agreement relationships, not direct transposition. Verify compliance obligations against the specific applicable framework for your jurisdiction.

---

## Data Sources & Freshness

All content is sourced from authoritative Tunisian legal databases:

- **[jurisitetunisie.com](https://www.jurisitetunisie.com/)** -- Comprehensive Tunisian legal database
- **[legislation.tn](https://legislation.tn/)** -- Official consolidated Tunisian legislation
- **[iort.gov.tn](https://www.iort.gov.tn/)** -- Journal Officiel de la République Tunisienne

### Data Provenance

| Field | Value |
|-------|-------|
| **Authority** | Journal Officiel de la République Tunisienne (JORT) |
| **Retrieval method** | Official statute downloads |
| **Languages** | Arabic and French (bilingual) |
| **Coverage** | 42 statutes, 575 provisions |
| **Database size** | ~1.2 MB |

### Automated Freshness Checks

A GitHub Actions workflow monitors all data sources:

| Check | Method |
|-------|--------|
| **Statute amendments** | Drift detection against known provision anchors |
| **New statutes** | Comparison against legislation.tn index |
| **Repealed statutes** | Status change detection |

**Verified data only** -- every citation is validated against official sources. Zero LLM-generated content.

---

## Security

This project uses multiple layers of automated security scanning:

| Scanner | What It Does | Schedule |
|---------|-------------|----------|
| **CodeQL** | Static analysis for security vulnerabilities | Weekly + PRs |
| **Semgrep** | SAST scanning (OWASP top 10, secrets, TypeScript) | Every push |
| **Gitleaks** | Secret detection across git history | Every push |
| **Trivy** | CVE scanning on filesystem and npm dependencies | Daily |
| **Socket.dev** | Supply chain attack detection | PRs |
| **Dependabot** | Automated dependency updates | Weekly |

See [SECURITY.md](SECURITY.md) for the full policy and vulnerability reporting.

---

## Important Disclaimers

### Legal Advice

> **THIS TOOL IS NOT LEGAL ADVICE**
>
> Statute text is sourced from official Tunisian legal publications (JORT, legislation.tn). However:
> - This is a **research tool**, not a substitute for professional legal counsel
> - **Court case coverage is not included** -- do not rely solely on this for case law research
> - **Verify critical citations** against primary sources for court filings
> - **EU cross-references** reflect alignment and association agreement relationships, not transposition
> - **Bilingual system** -- statutes exist in Arabic and French; verify against official JORT publications

**Before using professionally, read:** [DISCLAIMER.md](DISCLAIMER.md) | [SECURITY.md](SECURITY.md)

### Client Confidentiality

Queries go through the Claude API. For privileged or confidential matters, use on-premise deployment. Consult the **Ordre National des Avocats de Tunisie (الهيئة الوطنية للمحامين بتونس)** guidance on client confidentiality obligations.

---

## Development

### Setup

```bash
git clone https://github.com/Ansvar-Systems/Tunisian-law-mcp
cd Tunisian-law-mcp
npm install
npm run build
npm test
```

### Running Locally

```bash
npm run dev                                       # Start MCP server
npx @anthropic/mcp-inspector node dist/index.js   # Test with MCP Inspector
```

### Data Management

```bash
npm run ingest           # Ingest statutes from legislation.tn
npm run build:db         # Rebuild SQLite database
npm run drift:detect     # Run drift detection against anchors
npm run check-updates    # Check for amendments and new statutes
npm run census           # Generate coverage census
```

### Performance

- **Search Speed:** <100ms for most FTS5 queries
- **Database Size:** ~1.2 MB (efficient, portable)
- **Reliability:** 100% ingestion success rate

---

## Related Projects: Complete Compliance Suite

This server is part of **Ansvar's Compliance Suite** -- MCP servers that work together for end-to-end compliance coverage:

### [@ansvar/eu-regulations-mcp](https://github.com/Ansvar-Systems/EU_compliance_MCP)
**Query 49 EU regulations directly from Claude** -- GDPR, AI Act, DORA, NIS2, MiFID II, eIDAS, and more. Full regulatory text with article-level search. `npx @ansvar/eu-regulations-mcp`

### [@ansvar/security-controls-mcp](https://github.com/Ansvar-Systems/security-controls-mcp)
**Query 261 security frameworks** -- ISO 27001, NIST CSF, SOC 2, CIS Controls, SCF, and more. `npx @ansvar/security-controls-mcp`

### [@ansvar/us-regulations-mcp](https://github.com/Ansvar-Systems/US_Compliance_MCP)
**Query US federal and state compliance laws** -- HIPAA, CCPA, SOX, GLBA, FERPA, and more. `npx @ansvar/us-regulations-mcp`

### [@ansvar/sanctions-mcp](https://github.com/Ansvar-Systems/Sanctions-MCP)
**Offline-capable sanctions screening** -- OFAC, EU, UN sanctions lists. `pip install ansvar-sanctions-mcp`

**108 national law MCPs** covering Tunisia, Morocco, Algeria, Egypt, France, Germany, Italy, Spain, UAE, Jordan, and more.

---

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Priority areas:
- Court case law expansion (Cour de Cassation decisions)
- Additional statute coverage from JORT archives
- Historical statute versions and amendment tracking
- Arabic full-text search improvements

---

## Roadmap

- [x] Core statute database with FTS5 search
- [x] Full corpus ingestion (42 statutes, 575 provisions)
- [x] EU law alignment tools (Association Agreement framework)
- [x] Vercel Streamable HTTP deployment
- [x] npm package publication
- [ ] Court case law expansion (Cour de Cassation)
- [ ] Additional statute coverage
- [ ] Historical statute versions (amendment tracking)
- [ ] Arabic-language query optimisation

---

## Citation

If you use this MCP server in academic research:

```bibtex
@software{tunisian_law_mcp_2026,
  author = {Ansvar Systems AB},
  title = {Tunisian Law MCP Server: AI-Powered Legal Research Tool},
  year = {2026},
  url = {https://github.com/Ansvar-Systems/Tunisian-law-mcp},
  note = {42 Tunisian statutes with 575 provisions, bilingual Arabic-French}
}
```

---

## License

Apache License 2.0. See [LICENSE](./LICENSE) for details.

### Data Licenses

- **Statutes & Legislation:** Journal Officiel de la République Tunisienne (public domain)
- **EU Metadata:** EUR-Lex (EU public domain)

---

## About Ansvar Systems

We build AI-accelerated compliance and legal research tools for the global market. This MCP server started as our internal reference tool for North African and Mediterranean legal research -- turns out everyone working in the MENA region has the same research frustrations.

So we're open-sourcing it. Navigating Tunisian law across Arabic and French publications shouldn't require a law degree.

**[ansvar.eu](https://ansvar.eu)** -- Stockholm, Sweden

---

<p align="center">
  <sub>Built with care in Stockholm, Sweden</sub>
</p>
