/**
 * Rate-limited HTTP client for Tunisia Law
 *
 * - 500ms minimum delay between requests (be respectful to government servers)
 * - 15s timeout per request (government servers are often slow)
 * - User-Agent header identifying the MCP
 * - Fetches HTML from jurisitetunisie.com + legislation.tn
 * - No auth needed (Government Open Data)
 */

const USER_AGENT = 'tunisian-law-mcp/1.0 (https://github.com/Ansvar-Systems/tunisian-law-mcp; hello@ansvar.ai)';
const MIN_DELAY_MS = 500;
const REQUEST_TIMEOUT_MS = 15_000;

let lastRequestTime = 0;

async function rateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_DELAY_MS) {
    await new Promise(resolve => setTimeout(resolve, MIN_DELAY_MS - elapsed));
  }
  lastRequestTime = Date.now();
}

export interface FetchResult {
  status: number;
  body: string;
  contentType: string;
  url: string;
}

/**
 * Fetch a URL with rate limiting, timeout, and proper headers.
 * Retries on 429/5xx errors with exponential backoff.
 */
export async function fetchWithRateLimit(url: string, maxRetries = 1): Promise<FetchResult> {
  await rateLimit();

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const response = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html, */*',
          'Accept-Language': 'fr,ar;q=0.9,en;q=0.8',
        },
        redirect: 'follow',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 429 || response.status >= 500) {
        if (attempt < maxRetries) {
          const backoff = Math.pow(2, attempt + 1) * 1000;
          console.log(`  HTTP ${response.status} for ${url}, retrying in ${backoff}ms...`);
          await new Promise(resolve => setTimeout(resolve, backoff));
          continue;
        }
      }

      const body = await response.text();
      return {
        status: response.status,
        body,
        contentType: response.headers.get('content-type') ?? '',
        url: response.url,
      };
    } catch (error) {
      if (attempt < maxRetries) {
        const backoff = Math.pow(2, attempt + 1) * 1000;
        const msg = error instanceof Error ? error.message : String(error);
        console.log(`  Fetch error for ${url}: ${msg.substring(0, 60)}, retrying in ${backoff}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoff));
        continue;
      }

      // Return a synthetic failure response instead of throwing
      return {
        status: 0,
        body: '',
        contentType: '',
        url,
      };
    }
  }

  return {
    status: 0,
    body: '',
    contentType: '',
    url,
  };
}
