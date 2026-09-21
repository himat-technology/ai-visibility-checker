import { describe, expect, it } from "vitest";
import { auditPageClarity } from "@/lib/ai-visibility/page-clarity";

const BASE = "https://example.com/";

describe("auditPageClarity", () => {
  it("extracts title, description, canonical, h1, and robots meta", () => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <title>Example Domain</title>
  <meta name="description" content="This domain is for use in documentation examples." />
  <link rel="canonical" href="https://example.com/" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="index,follow" />
  <meta property="og:title" content="Example" />
</head>
<body>
  <h1>Example Domain</h1>
</body>
</html>`;

    const result = auditPageClarity(html, BASE);
    expect(result.title.exists).toBe(true);
    expect(result.title.value).toBe("Example Domain");
    expect(result.metaDescription.exists).toBe(true);
    expect(result.canonical.status).toBe("present");
    expect(result.h1.status).toBe("single");
    expect(result.lang.value).toBe("en");
    expect(result.viewport.present).toBe(true);
    expect(result.robotsMeta.noindex).toBe(false);
    expect(result.openGraph.title).toBe("Example");
  });

  it("detects missing title and multiple H1s", () => {
    const html = `<html><body><h1>One</h1><h1>Two</h1></body></html>`;
    const result = auditPageClarity(html, BASE);
    expect(result.title.exists).toBe(false);
    expect(result.h1.status).toBe("multiple");
    expect(result.h1.count).toBe(2);
  });

  it("detects noindex robots meta", () => {
    const html = `<html><head><meta name="robots" content="noindex, nofollow" /><title>Hidden</title></head><body></body></html>`;
    const result = auditPageClarity(html, BASE);
    expect(result.robotsMeta.noindex).toBe(true);
    expect(result.robotsMeta.nofollow).toBe(true);
  });

  it("flags different canonical", () => {
    const html = `<html><head>
      <title>Page</title>
      <link rel="canonical" href="https://example.com/other" />
    </head><body><h1>Hi</h1></body></html>`;
    const result = auditPageClarity(html, BASE);
    expect(result.canonical.status).toBe("different");
  });
});
