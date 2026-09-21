import { describe, expect, it } from "vitest";
import { parseOrganizationFromJsonLdBlocks } from "@/lib/ai-visibility/organization-schema";

describe("parseOrganizationFromJsonLdBlocks", () => {
  it("finds Organization object", () => {
    const result = parseOrganizationFromJsonLdBlocks([
      JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Acme Technologies",
        url: "https://example.com",
        logo: "https://example.com/logo.png",
        sameAs: ["https://twitter.com/acme"],
      }),
    ]);
    expect(result.status).toBe("found");
    expect(result.fields?.name).toBe("Acme Technologies");
    expect(result.fields?.logo).toBeTruthy();
    expect(result.fields?.sameAs).toHaveLength(1);
  });

  it("finds Organization inside @graph", () => {
    const result = parseOrganizationFromJsonLdBlocks([
      JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          { "@type": "WebSite", name: "Site" },
          {
            "@type": "Corporation",
            name: "Graph Corp",
            url: "https://example.com",
          },
        ],
      }),
    ]);
    expect(result.status).toBe("found");
    expect(result.fields?.name).toBe("Graph Corp");
    expect(result.fields?.type).toMatch(/Corporation/i);
  });

  it("supports array root", () => {
    const result = parseOrganizationFromJsonLdBlocks([
      JSON.stringify([
        { "@type": "WebPage", name: "Home" },
        {
          "@type": "LocalBusiness",
          name: "Local Shop",
          telephone: "+1-555-0100",
        },
      ]),
    ]);
    expect(result.status).toBe("found");
    expect(result.fields?.name).toBe("Local Shop");
  });

  it("handles malformed JSON", () => {
    const result = parseOrganizationFromJsonLdBlocks(["{not json"]);
    expect(result.status).toBe("invalid");
    expect(result.parseErrors.length).toBeGreaterThan(0);
  });

  it("reports missing Organization", () => {
    const result = parseOrganizationFromJsonLdBlocks([
      JSON.stringify({ "@type": "WebSite", name: "Only Website" }),
    ]);
    expect(result.status).toBe("missing");
  });
});
