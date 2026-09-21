import { describe, expect, it } from "vitest";
import { calculateScore } from "@/lib/ai-visibility/scoring";
import type {
  LlmsAuditResult,
  OrganizationAuditResult,
  PageClarityResult,
  RobotsAuditResult,
  SitemapAuditResult,
  TechnicalSignals,
} from "@/types/ai-visibility";
import { AI_CRAWLERS } from "@/types/ai-visibility";

function baseRobots(overrides: Partial<RobotsAuditResult> = {}): RobotsAuditResult {
  return {
    url: "https://example.com/robots.txt",
    found: true,
    statusCode: 200,
    contentType: "text/plain",
    rawContent: "User-agent: *\nAllow: /",
    sitemaps: ["https://example.com/sitemap.xml"],
    crawlers: AI_CRAWLERS.map((c) => ({
      name: c.name,
      userAgent: c.userAgent,
      mentioned: c.name === "OAI-SearchBot",
      status: "allowed" as const,
      details: "No blocking rule found",
      purpose: c.purpose,
    })),
    parseError: null,
    error: null,
    ...overrides,
  };
}

function baseSitemap(overrides: Partial<SitemapAuditResult> = {}): SitemapAuditResult {
  return {
    url: "https://example.com/sitemap.xml",
    found: true,
    statusCode: 200,
    contentType: "application/xml",
    validXml: true,
    kind: "urlset",
    urlCount: 10,
    nestedSitemapCount: null,
    referencedInRobots: true,
    robotsSitemapUrls: ["https://example.com/sitemap.xml"],
    truncated: false,
    error: null,
    ...overrides,
  };
}

function baseLlms(overrides: Partial<LlmsAuditResult> = {}): LlmsAuditResult {
  return {
    url: "https://example.com/llms.txt",
    found: false,
    statusCode: 404,
    contentType: null,
    contentLength: null,
    preview: null,
    error: null,
    ...overrides,
  };
}

function baseOrg(
  overrides: Partial<OrganizationAuditResult> = {},
): OrganizationAuditResult {
  return {
    status: "found",
    fields: {
      name: "Acme",
      url: "https://example.com",
      logo: "https://example.com/logo.png",
      sameAs: ["https://linkedin.com/company/acme"],
      address: null,
      telephone: null,
      description: null,
      type: "Organization",
    },
    rawTypesFound: ["Organization"],
    parseErrors: [],
    error: null,
    ...overrides,
  };
}

function baseClarity(
  overrides: Partial<PageClarityResult> = {},
): PageClarityResult {
  return {
    title: {
      exists: true,
      empty: false,
      value: "Acme Technologies Homepage",
      length: 26,
      reasonable: true,
    },
    metaDescription: {
      exists: true,
      empty: false,
      value: "Acme builds great products for everyone around the world.",
      length: 56,
    },
    canonical: {
      present: true,
      value: "https://example.com/",
      valid: true,
      matchesRequest: true,
      status: "present",
    },
    h1: { count: 1, texts: ["Welcome"], status: "single" },
    lang: { present: true, value: "en" },
    viewport: { present: true, value: "width=device-width" },
    robotsMeta: {
      present: false,
      value: null,
      noindex: false,
      nofollow: false,
      otherRestrictions: [],
    },
    openGraph: {
      title: "Acme",
      description: null,
      url: null,
      image: null,
    },
    ...overrides,
  };
}

function baseTechnical(
  overrides: Partial<TechnicalSignals> = {},
): TechnicalSignals {
  return {
    https: true,
    requestedUrl: "https://example.com/",
    finalUrl: "https://example.com/",
    redirected: false,
    statusCode: 200,
    contentType: "text/html",
    responseTimeMs: 120,
    htmlSizeBytes: 4000,
    xRobotsTag: null,
    hasStructuredData: true,
    error: null,
    ...overrides,
  };
}

describe("calculateScore", () => {
  it("scores a strong site near the top of the range", () => {
    const result = calculateScore({
      robots: baseRobots(),
      sitemap: baseSitemap(),
      llms: baseLlms({ found: true, statusCode: 200, contentLength: 100 }),
      organization: baseOrg(),
      pageClarity: baseClarity(),
      technical: baseTechnical(),
    });
    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.breakdown.llms).toBe(5);
  });

  it("penalizes missing sitemap and organization", () => {
    const strong = calculateScore({
      robots: baseRobots(),
      sitemap: baseSitemap(),
      llms: baseLlms(),
      organization: baseOrg(),
      pageClarity: baseClarity(),
      technical: baseTechnical(),
    });

    const weak = calculateScore({
      robots: baseRobots(),
      sitemap: baseSitemap({ found: false, validXml: false, kind: null }),
      llms: baseLlms(),
      organization: baseOrg({ status: "missing", fields: null }),
      pageClarity: baseClarity(),
      technical: baseTechnical(),
    });

    expect(weak.score).toBeLessThan(strong.score);
    expect(weak.recommendations.some((r) => /sitemap/i.test(r))).toBe(true);
    expect(weak.recommendations.some((r) => /Organization/i.test(r))).toBe(true);
  });

  it("treats blocked OAI-SearchBot as a warning with recommendation", () => {
    const robots = baseRobots({
      crawlers: AI_CRAWLERS.map((c) => ({
        name: c.name,
        userAgent: c.userAgent,
        mentioned: c.name === "OAI-SearchBot",
        status: c.name === "OAI-SearchBot" ? ("blocked" as const) : ("allowed" as const),
        details:
          c.name === "OAI-SearchBot"
            ? "Disallow rule found"
            : "No blocking rule found",
        purpose: c.purpose,
      })),
    });

    const result = calculateScore({
      robots,
      sitemap: baseSitemap(),
      llms: baseLlms(),
      organization: baseOrg(),
      pageClarity: baseClarity(),
      technical: baseTechnical(),
    });

    expect(
      result.findings.some((f) => f.id === "robots-oai-search-blocked"),
    ).toBe(true);
    expect(
      result.recommendations.some((r) => /OAI-SearchBot/i.test(r)),
    ).toBe(true);
  });

  it("never exceeds 100", () => {
    const result = calculateScore({
      robots: baseRobots(),
      sitemap: baseSitemap(),
      llms: baseLlms({ found: true, statusCode: 200, contentLength: 50 }),
      organization: baseOrg(),
      pageClarity: baseClarity(),
      technical: baseTechnical(),
    });
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
