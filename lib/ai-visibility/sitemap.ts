import { XMLParser } from "@/lib/ai-visibility/xml-lite";
import type { SitemapAuditResult, SitemapKind } from "@/types/ai-visibility";
import { friendlyFetchError, safeFetch } from "@/lib/ai-visibility/fetcher";
import { joinUrl } from "@/utils/url";

const MAX_URLS_COUNTED = 5_000;
const MAX_NESTED_SITEMAPS = 50;

export interface ParsedSitemap {
  kind: SitemapKind;
  validXml: boolean;
  urlCount: number;
  nestedSitemapCount: number;
  truncated: boolean;
  error: string | null;
}

/**
 * Parse sitemap XML (urlset or sitemapindex) with size limits.
 */
export function parseSitemapXml(xml: string): ParsedSitemap {
  const trimmed = xml.trim();
  if (!trimmed) {
    return {
      kind: null,
      validXml: false,
      urlCount: 0,
      nestedSitemapCount: 0,
      truncated: false,
      error: "Empty sitemap body",
    };
  }

  try {
    const doc = XMLParser.parse(trimmed);
    if (!doc) {
      return {
        kind: "unknown",
        validXml: false,
        urlCount: 0,
        nestedSitemapCount: 0,
        truncated: false,
        error: "Malformed XML",
      };
    }

    const rootName = doc.rootName?.toLowerCase() ?? "";

    if (rootName.includes("sitemapindex")) {
      const locs = doc.findAll("sitemap").length || countTag(trimmed, "sitemap");
      const truncated = locs > MAX_NESTED_SITEMAPS;
      return {
        kind: "index",
        validXml: true,
        urlCount: 0,
        nestedSitemapCount: Math.min(locs, MAX_NESTED_SITEMAPS),
        truncated,
        error: null,
      };
    }

    if (rootName.includes("urlset")) {
      let urlCount = doc.findAll("url").length;
      if (urlCount === 0) {
        urlCount = countTag(trimmed, "url");
      }
      const truncated = urlCount > MAX_URLS_COUNTED;
      return {
        kind: "urlset",
        validXml: true,
        urlCount: Math.min(urlCount, MAX_URLS_COUNTED),
        nestedSitemapCount: 0,
        truncated,
        error: null,
      };
    }

    // Heuristic fallback
    if (/<urlset[\s>]/i.test(trimmed)) {
      const urlCount = Math.min(countTag(trimmed, "url"), MAX_URLS_COUNTED);
      return {
        kind: "urlset",
        validXml: true,
        urlCount,
        nestedSitemapCount: 0,
        truncated: countTag(trimmed, "url") > MAX_URLS_COUNTED,
        error: null,
      };
    }
    if (/<sitemapindex[\s>]/i.test(trimmed)) {
      const nested = Math.min(countTag(trimmed, "sitemap"), MAX_NESTED_SITEMAPS);
      return {
        kind: "index",
        validXml: true,
        urlCount: 0,
        nestedSitemapCount: nested,
        truncated: countTag(trimmed, "sitemap") > MAX_NESTED_SITEMAPS,
        error: null,
      };
    }

    return {
      kind: "unknown",
      validXml: false,
      urlCount: 0,
      nestedSitemapCount: 0,
      truncated: false,
      error: "XML did not contain a recognized sitemap root element",
    };
  } catch {
    return {
      kind: "unknown",
      validXml: false,
      urlCount: 0,
      nestedSitemapCount: 0,
      truncated: false,
      error: "Malformed XML",
    };
  }
}

function countTag(xml: string, tag: string): number {
  const re = new RegExp(`<${tag}(\\s|>)`, "gi");
  const matches = xml.match(re);
  return matches ? matches.length : 0;
}

export async function auditSitemap(
  origin: string,
  robotsSitemapUrls: string[] = [],
): Promise<SitemapAuditResult> {
  const sitemapUrl = joinUrl(origin, "/sitemap.xml");
  const referencedInRobots =
    robotsSitemapUrls.length > 0 &&
    robotsSitemapUrls.some((u) => {
      try {
        const a = new URL(u);
        const b = new URL(sitemapUrl);
        return a.href === b.href || a.pathname.endsWith("sitemap.xml");
      } catch {
        return u.includes("sitemap");
      }
    });

  // Prefer /sitemap.xml; if robots declares others, still report reference
  try {
    const res = await safeFetch(sitemapUrl, {
      accept: "application/xml,text/xml,*/*;q=0.8",
    });

    if (res.status === 404) {
      // Try first robots-declared sitemap if different
      const alt = robotsSitemapUrls.find((u) => {
        try {
          return new URL(u).href !== new URL(sitemapUrl).href;
        } catch {
          return false;
        }
      });

      if (alt) {
        return fetchAndParseSitemap(alt, robotsSitemapUrls, true);
      }

      return {
        url: sitemapUrl,
        found: false,
        statusCode: 404,
        contentType: res.contentType,
        validXml: false,
        kind: null,
        urlCount: null,
        nestedSitemapCount: null,
        referencedInRobots: robotsSitemapUrls.length > 0,
        robotsSitemapUrls,
        truncated: false,
        error: null,
      };
    }

    if (!res.ok) {
      return {
        url: sitemapUrl,
        found: false,
        statusCode: res.status,
        contentType: res.contentType,
        validXml: false,
        kind: null,
        urlCount: null,
        nestedSitemapCount: null,
        referencedInRobots: robotsSitemapUrls.length > 0,
        robotsSitemapUrls,
        truncated: false,
        error: `Sitemap returned HTTP ${res.status}`,
      };
    }

    const parsed = parseSitemapXml(res.bodyText);
    return {
      url: res.finalUrl || sitemapUrl,
      found: true,
      statusCode: res.status,
      contentType: res.contentType,
      validXml: parsed.validXml,
      kind: parsed.kind,
      urlCount: parsed.kind === "urlset" ? parsed.urlCount : null,
      nestedSitemapCount: parsed.kind === "index" ? parsed.nestedSitemapCount : null,
      referencedInRobots: referencedInRobots || robotsSitemapUrls.length > 0,
      robotsSitemapUrls,
      truncated: parsed.truncated,
      error: parsed.error,
    };
  } catch (err) {
    const { message } = friendlyFetchError(err);
    return {
      url: sitemapUrl,
      found: false,
      statusCode: null,
      contentType: null,
      validXml: false,
      kind: null,
      urlCount: null,
      nestedSitemapCount: null,
      referencedInRobots: robotsSitemapUrls.length > 0,
      robotsSitemapUrls,
      truncated: false,
      error: message,
    };
  }
}

async function fetchAndParseSitemap(
  url: string,
  robotsSitemapUrls: string[],
  referencedInRobots: boolean,
): Promise<SitemapAuditResult> {
  try {
    const res = await safeFetch(url, {
      accept: "application/xml,text/xml,*/*;q=0.8",
    });
    if (!res.ok) {
      return {
        url,
        found: false,
        statusCode: res.status,
        contentType: res.contentType,
        validXml: false,
        kind: null,
        urlCount: null,
        nestedSitemapCount: null,
        referencedInRobots,
        robotsSitemapUrls,
        truncated: false,
        error: `Sitemap returned HTTP ${res.status}`,
      };
    }
    const parsed = parseSitemapXml(res.bodyText);
    return {
      url: res.finalUrl || url,
      found: true,
      statusCode: res.status,
      contentType: res.contentType,
      validXml: parsed.validXml,
      kind: parsed.kind,
      urlCount: parsed.kind === "urlset" ? parsed.urlCount : null,
      nestedSitemapCount: parsed.kind === "index" ? parsed.nestedSitemapCount : null,
      referencedInRobots,
      robotsSitemapUrls,
      truncated: parsed.truncated,
      error: parsed.error,
    };
  } catch (err) {
    const { message } = friendlyFetchError(err);
    return {
      url,
      found: false,
      statusCode: null,
      contentType: null,
      validXml: false,
      kind: null,
      urlCount: null,
      nestedSitemapCount: null,
      referencedInRobots,
      robotsSitemapUrls,
      truncated: false,
      error: message,
    };
  }
}
