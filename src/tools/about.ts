/**
 * about — Server metadata, dataset statistics, and provenance.
 */

import type Database from '@ansvar/mcp-sqlite';

export interface AboutContext {
  version: string;
  fingerprint: string;
  dbBuilt: string;
}

function safeCount(db: InstanceType<typeof Database>, sql: string): number {
  try {
    const row = db.prepare(sql).get() as { count: number } | undefined;
    return row ? Number(row.count) : 0;
  } catch {
    return 0;
  }
}

export function getAbout(db: InstanceType<typeof Database>, context: AboutContext) {

  const euRefs = safeCount(db, 'SELECT COUNT(*) as count FROM eu_references');

  const stats: Record<string, number> = {
    documents: safeCount(db, 'SELECT COUNT(*) as count FROM legal_documents'),
    provisions: safeCount(db, 'SELECT COUNT(*) as count FROM legal_provisions'),
    definitions: safeCount(db, 'SELECT COUNT(*) as count FROM definitions'),
  };

  if (euRefs > 0) {
    stats.eu_documents = safeCount(db, 'SELECT COUNT(*) as count FROM eu_documents');
    stats.eu_references = euRefs;
  }

  return {
    name: 'Tunisia Law MCP',
    version: context.version,
    jurisdiction: 'TN',
    description:
      'Tunisia Law MCP — corpus quarantined 2026-04-26 pending Phase 4 backfill from official primary sources. The MCP boots and registers tools but search returns no results.',
    stats,
    data_sources: [],
    quarantine: {
      since: '2026-04-26',
      reason: 'Source legitimacy remediation — see CHANGELOG.md 2.0.0 and sources.yml.',
      backfill_candidates: [
        'https://www.iort.gov.tn/ (JORT — Journal Officiel de la Republique Tunisienne)',
        'https://juricaf.org/ (JuriCAF — francophone case law aggregator; Tunisian coverage to be verified)',
      ],
    },
    freshness: {
      database_built: context.dbBuilt,
    },
    disclaimer:
      'This is a research tool, not legal advice. Verify critical citations against official sources.',
    network: {
      name: 'Ansvar MCP Network',
      open_law: 'https://ansvar.eu/open-law',
      directory: 'https://ansvar.ai/mcp',
    },
  };
}
