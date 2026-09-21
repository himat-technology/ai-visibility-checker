import type { AuditReport } from "@/types/ai-visibility";

export function reportToMarkdown(report: AuditReport): string {
  const lines: string[] = [];

  lines.push("# AI Visibility Report");
  lines.push("");
  lines.push(`**URL:** ${report.url}`);
  lines.push(`**Timestamp:** ${report.timestamp}`);
  lines.push(`**Score:** ${report.score}/100 (${report.scoreLabel})`);
  lines.push("");
  lines.push(`> ${report.scoreDisclaimer}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Passed: ${report.summary.passed}`);
  lines.push(`- Warnings: ${report.summary.warnings}`);
  lines.push(`- Errors: ${report.summary.errors}`);
  lines.push(`- Informational: ${report.summary.informational}`);
  lines.push("");

  lines.push("## Score Breakdown");
  lines.push("");
  lines.push(
    `| Area | Score | Max |`,
  );
  lines.push(`|---|---:|---:|`);
  lines.push(`| Robots / crawlers | ${report.breakdown.robots} | ${report.breakdown.max.robots} |`);
  lines.push(`| Sitemap | ${report.breakdown.sitemap} | ${report.breakdown.max.sitemap} |`);
  lines.push(`| llms.txt | ${report.breakdown.llms} | ${report.breakdown.max.llms} |`);
  lines.push(
    `| Organization schema | ${report.breakdown.organization} | ${report.breakdown.max.organization} |`,
  );
  lines.push(
    `| Page clarity | ${report.breakdown.pageClarity} | ${report.breakdown.max.pageClarity} |`,
  );
  lines.push(
    `| Technical | ${report.breakdown.technical} | ${report.breakdown.max.technical} |`,
  );
  lines.push("");

  lines.push("## Robots & AI Crawlers");
  lines.push("");
  lines.push(`- robots.txt: ${report.robots.found ? "Found" : "Not found"}`);
  if (report.robots.statusCode != null) {
    lines.push(`- HTTP status: ${report.robots.statusCode}`);
  }
  if (report.robots.error) lines.push(`- Error: ${report.robots.error}`);
  lines.push("");
  lines.push("| Bot | Status | Details |");
  lines.push("|---|---|---|");
  for (const c of report.robots.crawlers) {
    lines.push(`| ${c.name} | ${c.status} | ${c.details} |`);
  }
  lines.push("");
  lines.push(
    "Note: OAI-SearchBot (ChatGPT Search discovery) is distinct from GPTBot (training-related).",
  );
  lines.push("");

  lines.push("## Sitemap");
  lines.push("");
  lines.push(`- Found: ${report.sitemap.found ? "Yes" : "No"}`);
  lines.push(`- URL: ${report.sitemap.url}`);
  if (report.sitemap.statusCode != null) {
    lines.push(`- HTTP status: ${report.sitemap.statusCode}`);
  }
  lines.push(`- Kind: ${report.sitemap.kind ?? "n/a"}`);
  lines.push(`- Valid XML: ${report.sitemap.validXml ? "Yes" : "No"}`);
  if (report.sitemap.urlCount != null) {
    lines.push(`- URL count: ${report.sitemap.urlCount}`);
  }
  if (report.sitemap.nestedSitemapCount != null) {
    lines.push(`- Nested sitemaps: ${report.sitemap.nestedSitemapCount}`);
  }
  lines.push(
    `- Referenced in robots.txt: ${report.sitemap.referencedInRobots || report.sitemap.robotsSitemapUrls.length > 0 ? "Yes" : "No"}`,
  );
  lines.push("");

  lines.push("## llms.txt");
  lines.push("");
  lines.push(`- Found: ${report.llms.found ? "Yes" : "No"} (optional signal)`);
  lines.push(`- URL: ${report.llms.url}`);
  if (report.llms.statusCode != null) {
    lines.push(`- HTTP status: ${report.llms.statusCode}`);
  }
  lines.push("");

  lines.push("## Organization Schema");
  lines.push("");
  lines.push(`- Status: ${report.organization.status}`);
  if (report.organization.fields) {
    const f = report.organization.fields;
    if (f.type) lines.push(`- Type: ${f.type}`);
    if (f.name) lines.push(`- Name: ${f.name}`);
    if (f.url) lines.push(`- URL: ${f.url}`);
    lines.push(`- Logo: ${f.logo ? "Detected" : "Not detected"}`);
    lines.push(`- sameAs: ${f.sameAs.length ? "Detected" : "Not detected"}`);
    if (f.telephone) lines.push(`- Telephone: ${f.telephone}`);
    if (f.address) lines.push(`- Address: ${f.address}`);
  }
  lines.push("");

  lines.push("## Page Clarity");
  lines.push("");
  lines.push(`- Title: ${report.pageClarity.title.value ?? "(missing)"}`);
  lines.push(
    `- Meta description: ${report.pageClarity.metaDescription.value ?? "(missing)"}`,
  );
  lines.push(`- Canonical: ${report.pageClarity.canonical.value ?? "(missing)"}`);
  lines.push(`- H1 count: ${report.pageClarity.h1.count}`);
  lines.push(`- Language: ${report.pageClarity.lang.value ?? "(missing)"}`);
  lines.push(
    `- Robots meta: ${report.pageClarity.robotsMeta.value ?? "(none)"}`,
  );
  lines.push("");

  lines.push("## Technical Signals");
  lines.push("");
  lines.push(`- HTTPS: ${report.technical.https ? "Yes" : "No"}`);
  lines.push(`- Final URL: ${report.technical.finalUrl}`);
  lines.push(`- HTTP status: ${report.technical.statusCode ?? "n/a"}`);
  lines.push(`- Response time: ${report.technical.responseTimeMs ?? "n/a"} ms`);
  lines.push(`- Content-Type: ${report.technical.contentType ?? "n/a"}`);
  lines.push(`- HTML size: ${report.technical.htmlSizeBytes ?? "n/a"} bytes`);
  lines.push("");

  lines.push("## Findings");
  lines.push("");
  for (const f of report.findings) {
    lines.push(`- **[${f.severity.toUpperCase()}]** ${f.title} — ${f.description}`);
  }
  lines.push("");

  lines.push("## Recommendations");
  lines.push("");
  if (report.recommendations.length === 0) {
    lines.push("No additional recommendations — checks look solid.");
  } else {
    for (const r of report.recommendations) {
      lines.push(`- ${r}`);
    }
  }
  lines.push("");
  lines.push("---");
  lines.push("Generated by Himat Technologies AI Visibility Checker");
  lines.push("");

  return lines.join("\n");
}

export function reportToExportJson(report: AuditReport): string {
  const payload = {
    url: report.url,
    timestamp: report.timestamp,
    score: report.score,
    scoreLabel: report.scoreLabel,
    scoreDisclaimer: report.scoreDisclaimer,
    breakdown: report.breakdown,
    summary: report.summary,
    robots: {
      ...report.robots,
      rawContent: undefined,
    },
    sitemap: report.sitemap,
    llms: report.llms,
    organization: report.organization,
    pageClarity: report.pageClarity,
    technical: report.technical,
    findings: report.findings,
    recommendations: report.recommendations,
  };
  return JSON.stringify(payload, null, 2);
}
