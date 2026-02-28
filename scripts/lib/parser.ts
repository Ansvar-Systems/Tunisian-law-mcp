/**
 * Tunisia Law HTML Parser
 *
 * Parses legislation pages from legislation.tn.
 * Handles both structured HTML and Word-generated HTML (MsoNormal).
 *
 * Tunisia uses "الفصل" for articles (Francophone influence), not "المادة".
 * Structure: الباب (chapter/part) > القسم (section) > الفصل (article)
 *
 * Source: legislation.tn (Portail National de l'Information Juridique)
 */

export interface ActIndexEntry {
  id: string;
  title: string;
  titleEn: string;
  shortName: string;
  status: 'in_force' | 'amended' | 'repealed' | 'not_yet_in_force';
  issuedDate: string;
  inForceDate: string;
  url: string;
  aknYear?: string;
  aknNumber?: string;
  description?: string;
}

export interface ParsedProvision {
  provision_ref: string;
  chapter?: string;
  section: string;
  title: string;
  content: string;
}

export interface ParsedDefinition {
  term: string;
  definition: string;
  source_provision?: string;
}

export interface ParsedAct {
  id: string;
  type: 'statute';
  title: string;
  title_en: string;
  short_name: string;
  status: string;
  issued_date: string;
  in_force_date: string;
  url: string;
  description?: string;
  provisions: ParsedProvision[];
  definitions: ParsedDefinition[];
}

/* ---------- Arabic numeral maps ---------- */

const EXACT_ORDINALS = new Map<string, number>([
  ['الأول', 1], ['الأولى', 1], ['الاول', 1], ['الاولى', 1],
  ['الثاني', 2], ['الثانية', 2], ['الثالث', 3], ['الثالثة', 3],
  ['الرابع', 4], ['الرابعة', 4], ['الخامس', 5], ['الخامسة', 5],
  ['السادس', 6], ['السادسة', 6], ['السابع', 7], ['السابعة', 7],
  ['الثامن', 8], ['الثامنة', 8], ['التاسع', 9], ['التاسعة', 9],
  ['العاشر', 10], ['العاشرة', 10],
  ['الحادي عشر', 11], ['الحادية عشرة', 11],
  ['الثاني عشر', 12], ['الثانية عشرة', 12],
  ['الثالث عشر', 13], ['الثالثة عشرة', 13],
  ['الرابع عشر', 14], ['الرابعة عشرة', 14],
  ['الخامس عشر', 15], ['الخامسة عشرة', 15],
  ['السادس عشر', 16], ['السادسة عشرة', 16],
  ['السابع عشر', 17], ['السابعة عشرة', 17],
  ['الثامن عشر', 18], ['الثامنة عشرة', 18],
  ['التاسع عشر', 19], ['التاسعة عشرة', 19],
  ['العشرون', 20], ['الثلاثون', 30], ['الأربعون', 40],
  ['الخمسون', 50], ['الستون', 60], ['السبعون', 70],
  ['الثمانون', 80], ['التسعون', 90], ['المائة', 100],
]);

/* ---------- Helpers ---------- */

function toAsciiDigits(input: string): string {
  return input
    .replace(/[٠-٩]/g, ch => String(ch.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, ch => String(ch.charCodeAt(0) - 1776));
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&ndash;/g, '\u2013')
    .replace(/&mdash;/g, '\u2014')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(parseInt(dec, 10)));
}

function stripTags(input: string): string {
  return input.replace(/<[^>]+>/g, ' ');
}

function normalizeWhitespace(input: string): string {
  return input
    .replace(/\u00a0/g, ' ')
    .replace(/[\u200E\u200F\u202A-\u202E]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function htmlToText(html: string): string {
  const withBreaks = html
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n- ');

  const decoded = decodeHtmlEntities(withBreaks);
  const stripped = stripTags(decoded);

  return normalizeWhitespace(
    stripped
      .replace(/\n\s*\n/g, '\n')
      .replace(/\s*\n\s*/g, '\n')
      .replace(/\n{3,}/g, '\n\n'),
  );
}

/**
 * Extract article number from a heading.
 * Tunisia uses "الفصل N" for articles.
 * Handles numeric (الفصل 5) and Arabic-Indic (الفصل ٥) digits.
 */
function parseArticleNumber(heading: string, fallbackIndex: number): string {
  const ascii = toAsciiDigits(heading);

  // Match numeric: الفصل 5, الفصل 12, المادة 3
  const numericMatch = ascii.match(/(\d+)/);
  if (numericMatch) {
    return String(parseInt(numericMatch[1], 10));
  }

  // Match Arabic ordinals
  const cleaned = normalizeWhitespace(
    heading
      .replace(/الفصل/g, '')
      .replace(/المادة/g, '')
      .replace(/[():\-–—]/g, ' ')
      .replace(/[\u064B-\u065F\u0670]/g, ''),
  );

  if (EXACT_ORDINALS.has(cleaned)) {
    return String(EXACT_ORDINALS.get(cleaned));
  }

  return String(fallbackIndex);
}

/**
 * Extract chapter/part name from heading text.
 * Recognizes: الباب (part/chapter), القسم (section), الجزء (part)
 */
function extractChapterHeading(text: string): string | undefined {
  const babMatch = text.match(/الباب\s+(.+)/);
  if (babMatch) return `الباب ${normalizeWhitespace(babMatch[1])}`;

  const qismMatch = text.match(/القسم\s+(.+)/);
  if (qismMatch) return `القسم ${normalizeWhitespace(qismMatch[1])}`;

  const juzMatch = text.match(/الجزء\s+(.+)/);
  if (juzMatch) return `الجزء ${normalizeWhitespace(juzMatch[1])}`;

  return undefined;
}

/**
 * Parse Tunisian legislation HTML.
 *
 * The HTML from legislation.tn comes in two flavors:
 * 1. Word-generated HTML with MsoNormal classes (most common)
 * 2. Simple structured HTML with p/div tags
 *
 * Articles are identified by bold text containing "الفصل" (article in Tunisian law)
 * or "المادة" (standard Arabic for article, used in some laws).
 */
export function parseTunisiaLawHtml(html: string, act: ActIndexEntry): ParsedAct {
  const provisions: ParsedProvision[] = [];
  const definitions: ParsedDefinition[] = [];

  // Normalize the full text for splitting
  const fullText = htmlToText(html);

  // Split into articles using الفصل or المادة as delimiters
  // Tunisia primarily uses الفصل but some laws use المادة
  const articlePattern = /(?:^|\n)\s*((?:الفصل|المادة)\s+(?:\d+|[٠-٩]+|الأول[ىة]?|الثاني[ة]?|الثالث[ة]?|الرابع[ة]?|الخامس[ة]?|السادس[ة]?|السابع[ة]?|الثامن[ة]?|التاسع[ة]?|العاشر[ة]?|[\u0600-\u06FF\s]+?))\s*[:\-–—]?\s*/g;

  const articleStarts: { heading: string; index: number }[] = [];
  let match: RegExpExecArray | null;

  while ((match = articlePattern.exec(fullText)) !== null) {
    articleStarts.push({
      heading: normalizeWhitespace(match[1]),
      index: match.index,
    });
  }

  // Track current chapter
  let currentChapter: string | undefined;

  // Also try to extract chapter headings from the full text
  const chapterPattern = /(?:^|\n)\s*((?:الباب|القسم|الجزء)\s+(?:\d+|[٠-٩]+|[\u0600-\u06FF\s]+?))\s*[:\-–—]?\s*/g;
  const chapterPositions: { chapter: string; index: number }[] = [];

  while ((match = chapterPattern.exec(fullText)) !== null) {
    const chapterName = extractChapterHeading(match[1]);
    if (chapterName) {
      chapterPositions.push({ chapter: chapterName, index: match.index });
    }
  }

  for (let i = 0; i < articleStarts.length; i++) {
    const start = articleStarts[i];
    const endIndex = i + 1 < articleStarts.length
      ? articleStarts[i + 1].index
      : fullText.length;

    const articleText = fullText.substring(start.index, endIndex).trim();
    const articleNum = parseArticleNumber(start.heading, i + 1);

    // Determine chapter from nearest preceding chapter heading
    for (const cp of chapterPositions) {
      if (cp.index <= start.index) {
        currentChapter = cp.chapter;
      }
    }

    // Extract content after the heading
    const headingEnd = articleText.indexOf('\n');
    const content = headingEnd > 0
      ? normalizeWhitespace(articleText.substring(headingEnd))
      : normalizeWhitespace(articleText.replace(start.heading, ''));

    if (content.length < 10) continue;

    const provisionRef = `art${articleNum}`;
    const title = start.heading;

    provisions.push({
      provision_ref: provisionRef,
      chapter: currentChapter,
      section: articleNum,
      title,
      content: content.substring(0, 12000),
    });

    // Extract definitions from first articles (typically الفصل 1 or 2 contain definitions)
    if (parseInt(articleNum) <= 3) {
      extractDefinitions(content, provisionRef, definitions);
    }
  }

  return {
    id: act.id,
    type: 'statute',
    title: act.title,
    title_en: act.titleEn,
    short_name: act.shortName,
    status: act.status,
    issued_date: act.issuedDate,
    in_force_date: act.inForceDate,
    url: act.url,
    description: act.description,
    provisions,
    definitions,
  };
}

/**
 * Extract term definitions from article text.
 * Looks for patterns like: term: definition, or "term" - definition
 */
function extractDefinitions(
  text: string,
  sourceProvision: string,
  definitions: ParsedDefinition[],
): void {
  // Match patterns: term: definition (Arabic colon is `:`)
  const lines = text.split('\n');
  const seenTerms = new Set<string>();

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length < 10) continue;

    // Pattern: term - definition or term : definition
    const sepIndex = trimmed.indexOf(':');
    const dashIndex = trimmed.indexOf(' - ');

    const idx = sepIndex > 0 && sepIndex < 80 ? sepIndex
      : dashIndex > 0 && dashIndex < 80 ? dashIndex
        : -1;

    if (idx < 0) continue;

    const term = normalizeWhitespace(trimmed.substring(0, idx).replace(/^[-\u2022\u2013\u2014*]/g, ''));
    const definition = normalizeWhitespace(trimmed.substring(idx + 1));

    if (term.length < 2 || term.length > 120 || definition.length < 8) continue;

    const dedupeKey = term.toLowerCase();
    if (seenTerms.has(dedupeKey)) continue;
    seenTerms.add(dedupeKey);

    definitions.push({ term, definition, source_provision: sourceProvision });
  }
}
