#!/usr/bin/env tsx
/**
 * Tunisia Law MCP -- Census-Driven Ingestion Pipeline
 *
 * Reads data/census.json and fetches + parses every ingestable law.
 *
 * Sources (in priority order):
 *   1. jurisitetunisie.com -- French HTML, structured article pages (primary)
 *   2. legislation.tn -- Arabic HTML, official portal (fallback, often slow)
 *
 * Features:
 *   - Resume support: skips Acts that already have a seed JSON file
 *   - Census update: writes provision counts + ingestion dates back to census.json
 *   - Rate limiting: 500ms minimum between requests
 *   - Multi-page support: fetches all sub-pages for jurisitetunisie.com codes
 *
 * Usage:
 *   npm run ingest                    # Full census-driven ingestion
 *   npm run ingest -- --limit 5       # Test with 5 acts
 *   npm run ingest -- --skip-fetch    # Reuse cached HTML (re-parse only)
 *   npm run ingest -- --force         # Re-ingest even if seed exists
 *   npm run ingest -- --resume        # Default: skip existing seeds
 *
 * License: Government Open Data / public domain
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { fetchWithRateLimit } from './lib/fetcher.js';
import { parseTunisiaLawHtml, parseTunisiaLawMultiPage, type ActIndexEntry, type ParsedAct } from './lib/parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_DIR = path.resolve(__dirname, '../data/source');
const SEED_DIR = path.resolve(__dirname, '../data/seed');
const CENSUS_PATH = path.resolve(__dirname, '../data/census.json');

/* ---------- Types ---------- */

interface CensusLawEntry {
  id: string;
  title: string;
  title_fr?: string;
  identifier: string;
  url: string;
  jurisite_pages?: string[];
  status: 'in_force' | 'amended' | 'repealed';
  category: 'act' | 'code';
  classification: 'ingestable' | 'excluded' | 'inaccessible';
  ingested: boolean;
  provision_count: number;
  ingestion_date: string | null;
}

interface CensusFile {
  schema_version: string;
  jurisdiction: string;
  jurisdiction_name: string;
  portal: string;
  census_date: string;
  agent: string;
  summary: {
    total_laws: number;
    ingestable: number;
    ocr_needed: number;
    inaccessible: number;
    excluded: number;
  };
  laws: CensusLawEntry[];
}

/* ---------- Helpers ---------- */

function parseArgs(): { limit: number | null; skipFetch: boolean; force: boolean } {
  const args = process.argv.slice(2);
  let limit: number | null = null;
  let skipFetch = false;
  let force = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
      limit = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--skip-fetch') {
      skipFetch = true;
    } else if (args[i] === '--force') {
      force = true;
    }
  }

  return { limit, skipFetch, force };
}

/**
 * Convert a census entry to an ActIndexEntry for the parser.
 */
function censusToActEntry(law: CensusLawEntry): ActIndexEntry {
  const parts = law.identifier.split('/');
  const aknYear = parts[1] ?? '';
  const aknNumber = parts[2] ?? '';

  return {
    id: law.id,
    title: law.title,
    titleEn: law.title_fr ?? law.title,
    shortName: (law.title_fr ?? law.title).length > 40
      ? (law.title_fr ?? law.title).substring(0, 37) + '...'
      : (law.title_fr ?? law.title),
    status: law.status === 'in_force' ? 'in_force' : law.status === 'amended' ? 'amended' : 'repealed',
    issuedDate: '',
    inForceDate: '',
    url: law.url,
    aknYear,
    aknNumber,
  };
}

/**
 * Discover sub-pages from a jurisitetunisie.com menu page.
 * Follows links to content pages within the same code directory.
 */
async function discoverJurisiteSubPages(menuUrl: string, skipFetch: boolean): Promise<string[]> {
  const cacheFile = path.join(SOURCE_DIR, `_menu_${menuUrl.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 100)}.html`);

  let html: string;
  if (skipFetch && fs.existsSync(cacheFile)) {
    html = fs.readFileSync(cacheFile, 'utf-8');
  } else {
    const result = await fetchWithRateLimit(menuUrl);
    if (result.status !== 200) return [menuUrl];
    html = result.body;
    fs.writeFileSync(cacheFile, html);
  }

  // Extract links from the menu page -- look for .htm/.html links in the SAME directory
  const baseDir = menuUrl.substring(0, menuUrl.lastIndexOf('/') + 1);
  // Extract the code subdirectory name (e.g., "ca" from .../codes/ca/menu.html)
  const codeDirMatch = baseDir.match(/\/codes\/([^/]+)\/$/);
  const codeDir = codeDirMatch ? codeDirMatch[1] : '';

  const linkPattern = /href=["']([^"']+\.html?)['"]/gi;
  const links = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = linkPattern.exec(html)) !== null) {
    const href = match[1];
    // Skip external links, anchors, javascript, and navigation
    if (href.startsWith('http') && !href.includes('jurisitetunisie.com')) continue;
    if (href.startsWith('#') || href.startsWith('javascript:')) continue;
    if (href.includes('menu')) continue; // Skip menu links to avoid recursion

    let fullUrl: string;
    if (href.startsWith('http')) {
      fullUrl = href;
    } else if (href.startsWith('/')) {
      fullUrl = `https://www.jurisitetunisie.com${href}`;
    } else {
      fullUrl = `${baseDir}${href}`;
    }

    // Only include links within the same code directory
    // e.g., for /codes/ca/menu.html, only include /codes/ca/*.htm
    if (codeDir && !fullUrl.includes(`/codes/${codeDir}/`)) continue;
    // Skip the top-level menu page we're already on, but allow sub-menus (menu-2.html etc.)
    const filename = fullUrl.substring(fullUrl.lastIndexOf('/') + 1);
    if (filename === 'menu.html' || filename === 'Menu.html' || filename === 'menua.html') continue;

    links.add(fullUrl);
  }

  if (links.size === 0) {
    // The menu page itself might contain article content
    return [menuUrl];
  }

  // Separate sub-menus from content pages
  const subMenus: string[] = [];
  const contentPages: string[] = [];

  for (const link of links) {
    const fname = link.substring(link.lastIndexOf('/') + 1);
    if (fname.startsWith('menu') && fname.endsWith('.html')) {
      subMenus.push(link);
    } else {
      contentPages.push(link);
    }
  }

  // Recursively discover pages from sub-menus
  for (const subMenu of subMenus) {
    const subCacheFile = path.join(SOURCE_DIR, `_menu_${subMenu.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 100)}.html`);

    let subHtml: string | null = null;
    if (skipFetch && fs.existsSync(subCacheFile)) {
      subHtml = fs.readFileSync(subCacheFile, 'utf-8');
    } else {
      const subResult = await fetchWithRateLimit(subMenu);
      if (subResult.status === 200) {
        subHtml = subResult.body;
        fs.writeFileSync(subCacheFile, subHtml);
      }
    }

    if (subHtml) {
      let subMatch: RegExpExecArray | null;
      const subLinkPattern = /href=["']([^"']+\.html?)['"]/gi;

      while ((subMatch = subLinkPattern.exec(subHtml)) !== null) {
        const href = subMatch[1];
        if (href.startsWith('http') && !href.includes('jurisitetunisie.com')) continue;
        if (href.startsWith('#') || href.startsWith('javascript:')) continue;

        let fullUrl: string;
        if (href.startsWith('http')) fullUrl = href;
        else if (href.startsWith('/')) fullUrl = `https://www.jurisitetunisie.com${href}`;
        else fullUrl = `${baseDir}${href}`;

        if (codeDir && !fullUrl.includes(`/codes/${codeDir}/`)) continue;
        const fname = fullUrl.substring(fullUrl.lastIndexOf('/') + 1);
        if (fname.startsWith('menu')) continue;

        contentPages.push(fullUrl);
      }
    }
  }

  // Deduplicate and sort
  return [...new Set(contentPages)].sort();
}

/**
 * Fetch all pages for a law and return combined HTML.
 */
async function fetchLawPages(
  law: CensusLawEntry,
  actId: string,
  skipFetch: boolean,
): Promise<{ html: string; pageCount: number; source: string } | null> {
  const pages: string[] = [];

  if (law.jurisite_pages && law.jurisite_pages.length > 0) {
    // Strategy 1: Use explicitly listed jurisite pages
    let allPages: string[] = [];

    for (const pageUrl of law.jurisite_pages) {
      // If it's a menu page, discover sub-pages
      if (pageUrl.includes('menu')) {
        const subPages = await discoverJurisiteSubPages(pageUrl, skipFetch);
        allPages.push(...subPages);
      } else {
        allPages.push(pageUrl);
      }
    }

    // Deduplicate
    allPages = [...new Set(allPages)];

    for (const pageUrl of allPages) {
      const cacheFile = path.join(SOURCE_DIR, `${actId}_${pageUrl.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 80)}.html`);

      if (skipFetch && fs.existsSync(cacheFile)) {
        pages.push(fs.readFileSync(cacheFile, 'utf-8'));
        continue;
      }

      const result = await fetchWithRateLimit(pageUrl);
      if (result.status === 200 && result.body.length > 100) {
        fs.writeFileSync(cacheFile, result.body);
        pages.push(result.body);
      }
    }

    if (pages.length > 0) {
      return { html: pages.join('\n<hr/>\n'), pageCount: pages.length, source: 'jurisitetunisie.com' };
    }
  }

  // Strategy 2: Fallback to the direct URL (legislation.tn etc.)
  const sourceFile = path.join(SOURCE_DIR, `${actId}.html`);

  if (skipFetch && fs.existsSync(sourceFile)) {
    const html = fs.readFileSync(sourceFile, 'utf-8');
    return { html, pageCount: 1, source: 'cached' };
  }

  const result = await fetchWithRateLimit(law.url, 0);
  if (result.status === 200 && result.body.length > 100) {
    fs.writeFileSync(sourceFile, result.body);
    return { html: result.body, pageCount: 1, source: 'legislation.tn' };
  }

  return null;
}

/* ---------- Main ---------- */

async function main(): Promise<void> {
  const { limit, skipFetch, force } = parseArgs();

  console.log('Tunisia Law MCP -- Ingestion Pipeline (Census-Driven)');
  console.log('====================================================\n');
  console.log(`  Sources:`);
  console.log(`    1. jurisitetunisie.com (French HTML, structured)`);
  console.log(`    2. legislation.tn (Arabic HTML, fallback)`);
  console.log(`  License: Government Publication (public domain)`);

  if (limit) console.log(`  --limit ${limit}`);
  if (skipFetch) console.log(`  --skip-fetch`);
  if (force) console.log(`  --force (re-ingest all)`);

  // Load census
  if (!fs.existsSync(CENSUS_PATH)) {
    console.error(`\nERROR: Census file not found at ${CENSUS_PATH}`);
    console.error('Run "npx tsx scripts/census.ts" first.');
    process.exit(1);
  }

  const census: CensusFile = JSON.parse(fs.readFileSync(CENSUS_PATH, 'utf-8'));
  const ingestable = census.laws.filter(l => l.classification === 'ingestable');

  // Sort: jurisitetunisie.com entries first (they are accessible), then legislation.tn fallbacks
  ingestable.sort((a, b) => {
    const aHasJurisite = a.jurisite_pages && a.jurisite_pages.length > 0 ? 0 : 1;
    const bHasJurisite = b.jurisite_pages && b.jurisite_pages.length > 0 ? 0 : 1;
    if (aHasJurisite !== bHasJurisite) return aHasJurisite - bHasJurisite;
    return a.id.localeCompare(b.id);
  });

  const acts = limit ? ingestable.slice(0, limit) : ingestable;

  console.log(`\n  Census: ${census.summary.total_laws} total, ${ingestable.length} ingestable`);
  console.log(`  Processing: ${acts.length} acts\n`);

  fs.mkdirSync(SOURCE_DIR, { recursive: true });
  fs.mkdirSync(SEED_DIR, { recursive: true });

  let processed = 0;
  let ingested = 0;
  let skipped = 0;
  let failed = 0;
  let totalProvisions = 0;
  let totalDefinitions = 0;
  const results: { act: string; provisions: number; definitions: number; status: string; source: string }[] = [];

  // Build a map for census updates
  const censusMap = new Map<string, CensusLawEntry>();
  for (const law of census.laws) {
    censusMap.set(law.id, law);
  }

  const today = new Date().toISOString().split('T')[0];

  for (const law of acts) {
    const act = censusToActEntry(law);
    const seedFile = path.join(SEED_DIR, `${act.id}.json`);

    // Resume support: skip if seed already exists (unless --force)
    if (!force && fs.existsSync(seedFile)) {
      try {
        const existing = JSON.parse(fs.readFileSync(seedFile, 'utf-8')) as ParsedAct;
        const provCount = existing.provisions?.length ?? 0;
        const defCount = existing.definitions?.length ?? 0;
        totalProvisions += provCount;
        totalDefinitions += defCount;

        // Update census entry
        const entry = censusMap.get(law.id);
        if (entry) {
          entry.ingested = true;
          entry.provision_count = provCount;
          entry.ingestion_date = entry.ingestion_date ?? today;
        }

        results.push({ act: act.shortName, provisions: provCount, definitions: defCount, status: 'resumed', source: 'cache' });
        skipped++;
        processed++;
        continue;
      } catch {
        // Corrupt seed file, re-ingest
      }
    }

    try {
      process.stdout.write(`  [${processed + 1}/${acts.length}] ${act.id}...`);

      const fetchResult = await fetchLawPages(law, act.id, skipFetch);

      if (!fetchResult) {
        console.log(` FAILED (no accessible source)`);

        const entry = censusMap.get(law.id);
        if (entry) {
          entry.classification = 'inaccessible';
        }

        results.push({ act: act.shortName, provisions: 0, definitions: 0, status: 'inaccessible', source: 'none' });
        failed++;
        processed++;
        continue;
      }

      console.log(` OK (${fetchResult.pageCount} pages, ${(fetchResult.html.length / 1024).toFixed(0)} KB, ${fetchResult.source})`);

      const parsed = parseTunisiaLawHtml(fetchResult.html, act);
      fs.writeFileSync(seedFile, JSON.stringify(parsed, null, 2));
      totalProvisions += parsed.provisions.length;
      totalDefinitions += parsed.definitions.length;
      console.log(`    -> ${parsed.provisions.length} provisions, ${parsed.definitions.length} definitions`);

      // Update census entry
      const entry = censusMap.get(law.id);
      if (entry) {
        entry.ingested = true;
        entry.provision_count = parsed.provisions.length;
        entry.ingestion_date = today;
        // Keep as ingestable (not inaccessible) since we got data
        entry.classification = 'ingestable';
      }

      results.push({
        act: act.shortName,
        provisions: parsed.provisions.length,
        definitions: parsed.definitions.length,
        status: 'OK',
        source: fetchResult.source,
      });
      ingested++;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.log(`  ERROR parsing ${act.id}: ${msg}`);
      results.push({ act: act.shortName, provisions: 0, definitions: 0, status: `ERROR: ${msg.substring(0, 80)}`, source: 'none' });
      failed++;
    }

    processed++;

    // Save census every 25 acts (checkpoint)
    if (processed % 25 === 0) {
      writeCensus(census, censusMap);
      console.log(`  [checkpoint] Census updated at ${processed}/${acts.length}`);
    }
  }

  // Final census update
  writeCensus(census, censusMap);

  // Report
  console.log(`\n${'='.repeat(70)}`);
  console.log('Ingestion Report');
  console.log('='.repeat(70));
  console.log(`\n  Sources used:`);
  const sourceBreakdown = new Map<string, number>();
  for (const r of results) {
    sourceBreakdown.set(r.source, (sourceBreakdown.get(r.source) ?? 0) + 1);
  }
  for (const [src, count] of sourceBreakdown) {
    console.log(`    ${src}: ${count}`);
  }
  console.log(`\n  Processed:   ${processed}`);
  console.log(`  New:         ${ingested}`);
  console.log(`  Resumed:     ${skipped}`);
  console.log(`  Failed:      ${failed}`);
  console.log(`  Total provisions:  ${totalProvisions}`);
  console.log(`  Total definitions: ${totalDefinitions}`);

  // Summary of failures
  const failures = results.filter(r => r.status === 'inaccessible' || r.status.startsWith('ERROR'));
  if (failures.length > 0) {
    console.log(`\n  Failed acts:`);
    for (const f of failures) {
      console.log(`    ${f.act}: ${f.status}`);
    }
  }

  // Zero-provision acts
  const zeroProv = results.filter(r => r.provisions === 0 && r.status === 'OK');
  if (zeroProv.length > 0) {
    console.log(`\n  Zero-provision acts (${zeroProv.length}):`);
    for (const z of zeroProv.slice(0, 20)) {
      console.log(`    ${z.act}`);
    }
    if (zeroProv.length > 20) {
      console.log(`    ... and ${zeroProv.length - 20} more`);
    }
  }

  console.log('');
}

function writeCensus(census: CensusFile, censusMap: Map<string, CensusLawEntry>): void {
  census.laws = Array.from(censusMap.values()).sort((a, b) =>
    a.title.localeCompare(b.title),
  );

  census.summary.total_laws = census.laws.length;
  census.summary.ingestable = census.laws.filter(l => l.classification === 'ingestable').length;
  census.summary.inaccessible = census.laws.filter(l => l.classification === 'inaccessible').length;
  census.summary.excluded = census.laws.filter(l => l.classification === 'excluded').length;

  fs.writeFileSync(CENSUS_PATH, JSON.stringify(census, null, 2));
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
