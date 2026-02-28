/**
 * Tunisia Law HTML Parser
 *
 * Parses legislation pages from multiple sources:
 *   1. jurisitetunisie.com -- French HTML with "Article N" pattern
 *   2. legislation.tn -- Arabic HTML (mixed structure)
 *
 * Tunisia uses "الفصل" for articles (Francophone influence), not "المادة".
 * French texts use "Article N" (standard).
 *
 * Structure hierarchy:
 *   Arabic: الباب (part/book) > القسم (section) > الفصل (article)
 *   French: Livre (book) > Titre (title) > Chapitre (chapter) > Section > Article
 *
 * Source: legislation.tn / jurisitetunisie.com
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

const FRENCH_ORDINALS = new Map<string, number>([
  ['premier', 1], ['première', 1], ['1er', 1], ['1ère', 1],
  ['deuxième', 2], ['2ème', 2], ['2e', 2],
  ['troisième', 3], ['3ème', 3], ['3e', 3],
  ['quatrième', 4], ['cinquième', 5], ['sixième', 6],
  ['septième', 7], ['huitième', 8], ['neuvième', 9],
  ['dixième', 10],
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
    .replace(/&laquo;/g, '\u00AB')
    .replace(/&raquo;/g, '\u00BB')
    .replace(/&agrave;/g, '\u00E0')
    .replace(/&eacute;/g, '\u00E9')
    .replace(/&egrave;/g, '\u00E8')
    .replace(/&ecirc;/g, '\u00EA')
    .replace(/&ccedil;/g, '\u00E7')
    .replace(/&ocirc;/g, '\u00F4')
    .replace(/&ucirc;/g, '\u00FB')
    .replace(/&iuml;/g, '\u00EF')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(parseInt(dec, 10)));
}

function stripTags(input: string): string {
  return input.replace(/<[^>]+>/g, ' ');
}

/**
 * Normalize whitespace within a single line (no newline handling).
 */
function normalizeWhitespace(input: string): string {
  return input
    .replace(/\u00a0/g, ' ')
    .replace(/[\u200E\u200F\u202A-\u202E\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Convert HTML to structured text, preserving line breaks at block boundaries.
 * Newlines mark paragraph/block boundaries (needed for article splitting).
 */
function htmlToText(html: string): string {
  // Remove scripts and styles entirely
  let cleaned = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  const withBreaks = cleaned
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n- ')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/td>/gi, ' | ')
    .replace(/<hr[^>]*>/gi, '\n');

  const decoded = decodeHtmlEntities(withBreaks);
  const stripped = stripTags(decoded);

  // Normalize: collapse spaces on each line, but PRESERVE newlines
  return stripped
    .replace(/\u00a0/g, ' ')
    .replace(/[\u200E\u200F\u202A-\u202E\u200B-\u200D\uFEFF]/g, '')
    .replace(/[^\S\n]+/g, ' ')      // Collapse spaces (not newlines) to single space
    .replace(/\n\s*\n/g, '\n')       // Collapse blank lines
    .replace(/\n{3,}/g, '\n\n')      // Max two consecutive newlines
    .trim();
}

/**
 * Detect if the HTML is primarily French (jurisitetunisie.com) or Arabic.
 */
function detectLanguage(html: string): 'fr' | 'ar' {
  const frenchMarkers = (html.match(/\bArticle\s+\d/gi) || []).length;
  const arabicMarkers = (html.match(/الفصل\s+/g) || []).length;
  // jurisitetunisie.com pages often have "jurisite" in them
  const isJurisite = html.includes('jurisite') || html.includes('Jurisite');

  if (isJurisite || frenchMarkers > arabicMarkers) return 'fr';
  return 'ar';
}

/**
 * Extract article number from a heading.
 * Tunisia uses "الفصل N" for Arabic, "Article N" for French.
 */
function parseArticleNumber(heading: string, fallbackIndex: number, lang: 'fr' | 'ar'): string {
  const ascii = toAsciiDigits(heading);

  // Match numeric: Article 5, الفصل 12, etc.
  const numericMatch = ascii.match(/(\d+)/);
  if (numericMatch) {
    return String(parseInt(numericMatch[1], 10));
  }

  if (lang === 'fr') {
    // French ordinals: "Article premier", "Article 1er"
    const lower = heading.toLowerCase().trim();
    for (const [word, num] of FRENCH_ORDINALS) {
      if (lower.includes(word)) return String(num);
    }
  } else {
    // Arabic ordinals
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
  }

  return String(fallbackIndex);
}

/**
 * Extract chapter/part name from heading text.
 * Arabic: الباب (part/chapter), القسم (section), الجزء (part)
 * French: Livre (book), Titre (title), Chapitre (chapter), Section
 */
function extractChapterHeading(text: string, lang: 'fr' | 'ar'): string | undefined {
  if (lang === 'ar') {
    const babMatch = text.match(/الباب\s+(.+)/);
    if (babMatch) return `الباب ${normalizeWhitespace(babMatch[1])}`;

    const qismMatch = text.match(/القسم\s+(.+)/);
    if (qismMatch) return `القسم ${normalizeWhitespace(qismMatch[1])}`;

    const juzMatch = text.match(/الجزء\s+(.+)/);
    if (juzMatch) return `الجزء ${normalizeWhitespace(juzMatch[1])}`;
  } else {
    const livreMatch = text.match(/Livre\s+(.+)/i);
    if (livreMatch) return `Livre ${normalizeWhitespace(livreMatch[1])}`;

    const titreMatch = text.match(/Titre\s+(.+)/i);
    if (titreMatch) return `Titre ${normalizeWhitespace(titreMatch[1])}`;

    const chapMatch = text.match(/Chapitre\s+(.+)/i);
    if (chapMatch) return `Chapitre ${normalizeWhitespace(chapMatch[1])}`;

    const secMatch = text.match(/Section\s+(.+)/i);
    if (secMatch) return `Section ${normalizeWhitespace(secMatch[1])}`;
  }

  return undefined;
}

/**
 * Parse French-language legislation from jurisitetunisie.com.
 *
 * Articles follow the pattern: "Article N -" or "Article premier -"
 * with content in subsequent paragraphs.
 * Some repealed articles are marked "(Abrogé)".
 */
function parseFrenchHtml(html: string, act: ActIndexEntry): ParsedAct {
  const provisions: ParsedProvision[] = [];
  const definitions: ParsedDefinition[] = [];

  const fullText = htmlToText(html);

  // French article pattern: "Article N", "Article premier", "Article N (nouveau)", etc.
  const articlePattern = /(?:^|\n)\s*(Article\s+(?:\d+|premier|première|1er|1ère)(?:\s*(?:bis|ter|quater|quinquies|sexies|septies|octies|novies|decies))?(?:\s*\([^)]*\))?)\s*[-–—.:]\s*/gi;

  const articleStarts: { heading: string; index: number }[] = [];
  let match: RegExpExecArray | null;

  while ((match = articlePattern.exec(fullText)) !== null) {
    articleStarts.push({
      heading: normalizeWhitespace(match[1]),
      index: match.index,
    });
  }

  // Chapter pattern
  const chapterPattern = /(?:^|\n)\s*((?:Livre|Titre|Chapitre|Section)\s+(?:\d+|premier|première|I{1,4}V?|V?I{0,4}|unique)(?:\s*[-–—.:]\s*[^\n]*)?)/gi;
  const chapterPositions: { chapter: string; index: number }[] = [];

  while ((match = chapterPattern.exec(fullText)) !== null) {
    const chapterName = extractChapterHeading(match[1], 'fr');
    if (chapterName) {
      chapterPositions.push({ chapter: chapterName, index: match.index });
    }
  }

  let currentChapter: string | undefined;

  for (let i = 0; i < articleStarts.length; i++) {
    const start = articleStarts[i];
    const endIndex = i + 1 < articleStarts.length
      ? articleStarts[i + 1].index
      : fullText.length;

    const articleText = fullText.substring(start.index, endIndex).trim();
    const articleNum = parseArticleNumber(start.heading, i + 1, 'fr');

    // Handle "bis", "ter", etc. suffixes
    const suffixMatch = start.heading.match(/\b(bis|ter|quater|quinquies|sexies|septies|octies|novies|decies)\b/i);
    const suffix = suffixMatch ? `-${suffixMatch[1].toLowerCase()}` : '';

    // Determine chapter
    for (const cp of chapterPositions) {
      if (cp.index <= start.index) {
        currentChapter = cp.chapter;
      }
    }

    // Skip repealed articles but note them
    const isRepealed = /\(abrog[ée]/i.test(start.heading) || /\(abrog[ée]/i.test(articleText.substring(0, 200));

    // Extract content after the heading
    const headingEnd = articleText.indexOf('\n');
    let content = headingEnd > 0
      ? normalizeWhitespace(articleText.substring(headingEnd))
      : normalizeWhitespace(articleText.replace(start.heading, ''));

    // Remove the dash/colon separator that may remain
    content = content.replace(/^[-–—.:]\s*/, '');

    if (content.length < 5 && !isRepealed) continue;
    if (isRepealed && content.length < 5) {
      content = '(Abrogé)';
    }

    const provisionRef = `art${articleNum}${suffix}`;

    provisions.push({
      provision_ref: provisionRef,
      chapter: currentChapter,
      section: `${articleNum}${suffix}`,
      title: start.heading,
      content: content.substring(0, 12000),
    });

    // Extract definitions from early articles
    if (parseInt(articleNum) <= 3 && !isRepealed) {
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
 * Parse Arabic-language legislation from legislation.tn or other Arabic sources.
 *
 * Articles use "الفصل N" (Tunisia's Francophone convention).
 * Some laws use "المادة N" (standard Arabic).
 */
function parseArabicHtml(html: string, act: ActIndexEntry): ParsedAct {
  const provisions: ParsedProvision[] = [];
  const definitions: ParsedDefinition[] = [];

  const fullText = htmlToText(html);

  // Split into articles using الفصل or المادة as delimiters
  const articlePattern = /(?:^|\n)\s*((?:الفصل|المادة)\s+(?:\d+|[٠-٩]+|الأول[ىة]?|الثاني[ة]?|الثالث[ة]?|الرابع[ة]?|الخامس[ة]?|السادس[ة]?|السابع[ة]?|الثامن[ة]?|التاسع[ة]?|العاشر[ة]?|[\u0600-\u06FF\s]+?))\s*[:\-–—]?\s*/g;

  const articleStarts: { heading: string; index: number }[] = [];
  let match: RegExpExecArray | null;

  while ((match = articlePattern.exec(fullText)) !== null) {
    articleStarts.push({
      heading: normalizeWhitespace(match[1]),
      index: match.index,
    });
  }

  // Chapter pattern
  let currentChapter: string | undefined;
  const chapterPattern = /(?:^|\n)\s*((?:الباب|القسم|الجزء)\s+(?:\d+|[٠-٩]+|[\u0600-\u06FF\s]+?))\s*[:\-–—]?\s*/g;
  const chapterPositions: { chapter: string; index: number }[] = [];

  while ((match = chapterPattern.exec(fullText)) !== null) {
    const chapterName = extractChapterHeading(match[1], 'ar');
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
    const articleNum = parseArticleNumber(start.heading, i + 1, 'ar');

    for (const cp of chapterPositions) {
      if (cp.index <= start.index) {
        currentChapter = cp.chapter;
      }
    }

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
 * Main parser entry point.
 * Automatically detects French vs Arabic and dispatches to the appropriate parser.
 */
export function parseTunisiaLawHtml(html: string, act: ActIndexEntry): ParsedAct {
  const lang = detectLanguage(html);
  if (lang === 'fr') {
    return parseFrenchHtml(html, act);
  }
  return parseArabicHtml(html, act);
}

/**
 * Parse multiple HTML pages (from jurisitetunisie.com sub-pages) into a single act.
 * Concatenates HTML from multiple pages before parsing.
 */
export function parseTunisiaLawMultiPage(pages: string[], act: ActIndexEntry): ParsedAct {
  const combined = pages.join('\n<hr class="page-break" />\n');
  return parseTunisiaLawHtml(combined, act);
}

/**
 * Extract term definitions from article text.
 * Looks for patterns in both French and Arabic.
 */
function extractDefinitions(
  text: string,
  sourceProvision: string,
  definitions: ParsedDefinition[],
): void {
  const lines = text.split('\n');
  const seenTerms = new Set<string>();

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length < 10) continue;

    // Pattern: term: definition, term - definition, "term" : definition
    const sepIndex = trimmed.indexOf(':');
    const dashIndex = trimmed.indexOf(' - ');
    const colonArabicIndex = trimmed.indexOf(' : ');

    const idx = sepIndex > 0 && sepIndex < 80 ? sepIndex
      : dashIndex > 0 && dashIndex < 80 ? dashIndex
        : colonArabicIndex > 0 && colonArabicIndex < 80 ? colonArabicIndex
          : -1;

    if (idx < 0) continue;

    const term = normalizeWhitespace(
      trimmed.substring(0, idx)
        .replace(/^[-\u2022\u2013\u2014*«»"]/g, '')
        .replace(/[«»"]/g, ''),
    );
    const definition = normalizeWhitespace(trimmed.substring(idx + 1));

    if (term.length < 2 || term.length > 120 || definition.length < 8) continue;

    const dedupeKey = term.toLowerCase();
    if (seenTerms.has(dedupeKey)) continue;
    seenTerms.add(dedupeKey);

    definitions.push({ term, definition, source_provision: sourceProvision });
  }
}
