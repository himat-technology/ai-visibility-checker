import { describe, expect, it } from "vitest";
import { parseSitemapXml } from "@/lib/ai-visibility/sitemap";

describe("parseSitemapXml", () => {
  it("parses a valid urlset", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/</loc></url>
  <url><loc>https://example.com/about</loc></url>
</urlset>`;
    const result = parseSitemapXml(xml);
    expect(result.validXml).toBe(true);
    expect(result.kind).toBe("urlset");
    expect(result.urlCount).toBe(2);
  });

  it("parses a sitemap index", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://example.com/sitemap-1.xml</loc></sitemap>
  <sitemap><loc>https://example.com/sitemap-2.xml</loc></sitemap>
</sitemapindex>`;
    const result = parseSitemapXml(xml);
    expect(result.validXml).toBe(true);
    expect(result.kind).toBe("index");
    expect(result.nestedSitemapCount).toBe(2);
  });

  it("handles malformed XML", () => {
    const result = parseSitemapXml("<<<this is not xml>>>");
    expect(result.validXml).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("handles empty body as missing/invalid", () => {
    const result = parseSitemapXml("");
    expect(result.validXml).toBe(false);
    expect(result.kind).toBeNull();
  });
});
