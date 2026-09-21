import { describe, expect, it } from "vitest";
import {
  buildCrawlerMatrix,
  evaluateCrawlerAccess,
  parseRobotsTxt,
} from "@/lib/ai-visibility/robots";

describe("parseRobotsTxt", () => {
  it("parses allow/disallow groups and sitemaps", () => {
    const parsed = parseRobotsTxt(`
User-agent: GPTBot
Disallow: /

User-agent: OAI-SearchBot
Allow: /

Sitemap: https://example.com/sitemap.xml
`);
    expect(parsed.sitemaps).toEqual(["https://example.com/sitemap.xml"]);
    expect(parsed.groups.length).toBeGreaterThanOrEqual(2);
  });

  it("handles malformed lines without throwing", () => {
    const parsed = parseRobotsTxt(`
User-agent: *
Disallow: /
this is not valid
Sitemap: https://example.com/sitemap.xml
`);
    expect(parsed.malformed).toBe(true);
    expect(parsed.sitemaps).toHaveLength(1);
  });
});

describe("evaluateCrawlerAccess", () => {
  it("detects an explicitly allowed bot", () => {
    const parsed = parseRobotsTxt(`User-agent: OAI-SearchBot\nAllow: /\n`);
    const result = evaluateCrawlerAccess(parsed, "OAI-SearchBot");
    expect(result.status).toBe("allowed");
    expect(result.mentioned).toBe(true);
  });

  it("detects an explicitly blocked bot", () => {
    const parsed = parseRobotsTxt(`User-agent: ClaudeBot\nDisallow: /\n`);
    const result = evaluateCrawlerAccess(parsed, "ClaudeBot");
    expect(result.status).toBe("blocked");
    expect(result.mentioned).toBe(true);
  });

  it("applies wildcard rules when no specific rule exists", () => {
    const parsed = parseRobotsTxt(`User-agent: *\nDisallow: /\n`);
    const result = evaluateCrawlerAccess(parsed, "GPTBot");
    expect(result.status).toBe("blocked");
    expect(result.mentioned).toBe(false);
  });

  it("returns not_specified when no matching rule", () => {
    const parsed = parseRobotsTxt(`User-agent: Googlebot\nDisallow: /private\n`);
    const result = evaluateCrawlerAccess(parsed, "OAI-AdsBot");
    expect(result.status).toBe("not_specified");
  });
});

describe("buildCrawlerMatrix", () => {
  it("includes all expected AI crawlers", () => {
    const parsed = parseRobotsTxt(`User-agent: *\nAllow: /\n`);
    const matrix = buildCrawlerMatrix(parsed);
    const names = matrix.map((m) => m.name);
    expect(names).toEqual([
      "OAI-SearchBot",
      "OAI-AdsBot",
      "GPTBot",
      "ClaudeBot",
      "Google-Extended",
    ]);
  });
});
