import type { AuditReport, PageClarityResult, TechnicalSignals } from "@/types/ai-visibility";
import { friendlyFetchError, safeFetch } from "@/lib/ai-visibility/fetcher";
import { auditLlms } from "@/lib/ai-visibility/llms";
import { auditOrganizationSchema, extractJsonLdBlocks } from "@/lib/ai-visibility/organization-schema";
import { auditPageClarity } from "@/lib/ai-visibility/page-clarity";
import { auditRobots } from "@/lib/ai-visibility/robots";
import { calculateScore, summarizeFindings } from "@/lib/ai-visibility/scoring";
import { auditSitemap } from "@/lib/ai-visibility/sitemap";
import { normalizeUrl, originFromUrl } from "@/utils/url";

const EMPTY_CLARITY: PageClarityResult = {
  title: { exists: false, empty: true, value: null, length: 0, reasonable: false },
  metaDescription: { exists: false, empty: true, value: null, length: 0 },
  canonical: {
    present: false,
    value: null,
    valid: false,
    matchesRequest: null,
    status: "missing",
  },
  h1: { count: 0, texts: [], status: "none" },
  lang: { present: false, value: null },
  viewport: { present: false, value: null },
  robotsMeta: {
    present: false,
    value: null,
    noindex: false,
    nofollow: false,
    otherRestrictions: [],
  },
  openGraph: { title: null, description: null, url: null, image: null },
};

/**
 * Run a full first-party AI visibility audit for a public URL.
 * Individual check failures are captured in the report; they do not abort the whole audit.
 */
export async function runAudit(rawUrl: string): Promise<AuditReport> {
  const url = normalizeUrl(rawUrl);
  const origin = originFromUrl(url);
  const requestedUrl = url.toString();

  // Fetch main page first (needed for clarity / schema / technical)
  let html = "";
  let technical: TechnicalSignals = {
    https: url.protocol === "https:",
    requestedUrl,
    finalUrl: requestedUrl,
    redirected: false,
    statusCode: null,
    contentType: null,
    responseTimeMs: null,
    htmlSizeBytes: null,
    xRobotsTag: null,
    hasStructuredData: false,
    error: null,
  };

  try {
    const page = await safeFetch(requestedUrl, {
      accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
    });
    html = page.bodyText;
    technical = {
      https: new URL(page.finalUrl).protocol === "https:",
      requestedUrl,
      finalUrl: page.finalUrl,
      redirected: page.redirected || page.finalUrl !== requestedUrl,
      statusCode: page.status,
      contentType: page.contentType,
      responseTimeMs: page.responseTimeMs,
      htmlSizeBytes: page.bodyBytes,
      xRobotsTag: page.headers.get("x-robots-tag"),
      hasStructuredData: extractJsonLdBlocks(html).length > 0,
      error: page.ok
        ? null
        : `Page returned HTTP ${page.status}`,
    };
  } catch (err) {
    const { message } = friendlyFetchError(err);
    technical = {
      ...technical,
      error: message,
    };
  }

  const pageOrigin = (() => {
    try {
      return originFromUrl(new URL(technical.finalUrl));
    } catch {
      return origin;
    }
  })();

  // Run independent checks in parallel (robots, sitemap depends on robots sitemaps — sequence robots then sitemap)
  const robots = await auditRobots(pageOrigin);

  const [sitemap, llms] = await Promise.all([
    auditSitemap(pageOrigin, robots.sitemaps),
    auditLlms(pageOrigin),
  ]);

  const organization = html
    ? auditOrganizationSchema(html)
    : {
        status: "missing" as const,
        fields: null,
        rawTypesFound: [],
        parseErrors: [],
        error: technical.error ? "Page HTML unavailable" : null,
      };

  const pageClarity = html
    ? auditPageClarity(html, requestedUrl, technical.finalUrl)
    : EMPTY_CLARITY;

  const scored = calculateScore({
    robots,
    sitemap,
    llms,
    organization,
    pageClarity,
    technical,
  });

  // Deduplicate recommendations while preserving order
  const recommendations = [...new Set(scored.recommendations)];

  return {
    url: requestedUrl,
    timestamp: new Date().toISOString(),
    score: scored.score,
    scoreLabel: "Technical readiness",
    scoreDisclaimer:
      "This score summarizes the first-party technical checks performed by this tool. It is not a prediction of AI citations or search rankings.",
    breakdown: scored.breakdown,
    summary: summarizeFindings(scored.findings),
    robots,
    sitemap,
    llms,
    organization,
    pageClarity,
    technical,
    findings: scored.findings,
    recommendations,
  };
}
