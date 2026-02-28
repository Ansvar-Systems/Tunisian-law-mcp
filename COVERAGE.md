# Coverage Index -- Tunisia Law MCP

> Auto-generated from census + ingestion data. Do not edit manually.
> Generated: 2026-02-28

## Source

| Field | Value |
|-------|-------|
| Authority | Government of Tunisia |
| Primary Source | [jurisitetunisie.com](https://www.jurisitetunisie.com) (33 codes, French HTML) |
| Official Portal | [legislation.tn](http://www.legislation.tn) (often inaccessible) |
| License | Government Publication (public domain) |
| Languages | Arabic (ar), French (fr) |
| Census date | 2026-02-28 |

## Summary

| Metric | Count |
|--------|-------|
| Total laws enumerated | 96 |
| Ingested | 42 |
| Inaccessible (legislation.tn 503) | 54 |
| Provisions extracted | 542 |
| Definitions extracted | 41 |
| Database size | 1.2 MB |
| **Coverage (ingested/enumerated)** | **43.8%** |

## Coverage Breakdown

| Source | Laws | Provisions | Status |
|--------|------|-----------|--------|
| jurisitetunisie.com (scraped) | 33 | 476 | Automated HTML scraping |
| legislation.tn (curated seeds) | 9 | 66 | Manual curation (portal 503) |
| legislation.tn (inaccessible) | 54 | -- | HTTP 503 -- needs VPN or portal recovery |
| **Total** | **42** | **542** | |

## Top Laws by Provision Count

| Title | French Title | Provisions |
|-------|-------------|-----------|
| المجلة الجزائية | Code Penal | 96 |
| دستور الجمهورية التونسية 2022 | Constitution 2022 | 81 |
| مجلة التحكيم | Code de l'Arbitrage | 49 |
| مجلة الضريبة | Code IRPP/IS | 40 |
| مجلة هيئات التوظيف الجماعي | Code OPC | 29 |
| مجلة الاتصالات | Code des Telecommunications | 29 |
| مجلة حماية التراث | Code du Patrimoine | 27 |
| مجلة الصحافة | Code de la Presse | 25 |
| مجلة المرافعات المدنية | Code de Proc. Civile | 24 |
| مجلة الشركات التجارية | Code des Societes | 23 |
| مجلة الطرقات | Code de la Route | 22 |
| مجلة الجباية المحلية | Code de la Fiscalite Locale | 13 |

## Not Yet Ingested (54 laws)

These laws are enumerated in the census but legislation.tn returns HTTP 503. They will be ingested when the portal becomes available or via the VPN ingestion pipeline.

| Category | Count | Examples |
|----------|-------|---------|
| Codes (no jurisite text) | 5 | Customs, Water, Forest, Mining, Maritime Ports |
| Individual laws | 30+ | Data Protection impl., Competition, Banking, Environment |
| Decrees | 8 | Public Procurement, AML implementation, Anti-corruption |
| Decree-laws | 5 | Press freedom, Audiovisual, Administrative access |

## Technical Notes

- FTS5 uses `tokenize='unicode61'` for Arabic + French full-text search
- Tunisia uses "الفصل" (fasl) for articles in Arabic, "Article N" in French
- Parser auto-detects French vs Arabic content and dispatches to appropriate handler
- Jurisitetunisie.com menu pages use JavaScript-based expanding navigation; some codes have incomplete sub-page discovery
