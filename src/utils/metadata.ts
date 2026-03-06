/**
 * Response metadata utilities for Tunisia Law MCP.
 */

import type Database from '@ansvar/mcp-sqlite';

export interface ResponseMetadata {
  data_source: string;
  jurisdiction: string;
  disclaimer: string;
  freshness?: string;
  note?: string;
  query_strategy?: string;
}

export interface ToolResponse<T> {
  results: T;
  _metadata: ResponseMetadata;
}

export function generateResponseMetadata(
  db: InstanceType<typeof Database>,
): ResponseMetadata {
  let freshness: string | undefined;
  try {
    const row = db.prepare(
      "SELECT value FROM db_metadata WHERE key = 'built_at'"
    ).get() as { value: string } | undefined;
    if (row) freshness = row.value;
  } catch {
    // Ignore
  }

  return {
    data_source: 'Legislation Tunisienne (legislation.tn) — Imprimerie Officielle de la Republique Tunisienne',
    jurisdiction: 'TN',
    disclaimer:
      'This data is sourced from Legislation Tunisienne. ' +
      'The authoritative versions are in Arabic and French. ' +
      'Always verify with the official portal (legislation.tn).',
    freshness,
  };
}
