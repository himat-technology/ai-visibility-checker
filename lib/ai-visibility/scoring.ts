import type {
  AuditReport,
  Finding,
  OrganizationAuditResult,
  PageClarityResult,
  RobotsAuditResult,
  ScoreBreakdown,
  SitemapAuditResult,
  TechnicalSignals,
  LlmsAuditResult,
} from "@/types/ai-visibility";
import { SCORE_MAX } from "@/types/ai-visibility";

export interface ScoringInput {
  robots: RobotsAuditResult;
  sitemap: SitemapAuditResult;
  llms: LlmsAuditResult;
  organization: OrganizationAuditResult;
  pageClarity: PageClarityResult;
  technical: TechnicalSignals;
}

export interface ScoringOutput {
  score: number;
  breakdown: ScoreBreakdown;
  findings: Finding[];
  recommendations: string[];
}

export function calculateScore(input: ScoringInput): ScoringOutput {
  const findings: Finding[] = [];
  const recommendations: string[] = [];

  const robotsScore = scoreRobots(input.robots, findings, recommendations);
  const sitemapScore = scoreSitemap(input.sitemap, findings, recommendations);
  const llmsScore = scoreLlms(input.llms, findings, recommendations);
  const orgScore = scoreOrganization(input.organization, findings, recommendations);
  const clarityScore = scorePageClarity(input.pageClarity, findings, recommendations);
  const technicalScore = scoreTechnical(input.technical, findings, recommendations);

  const breakdown: ScoreBreakdown = {
    robots: robotsScore,
    sitemap: sitemapScore,
    llms: llmsScore,
    organization: orgScore,
    pageClarity: clarityScore,
    technical: technicalScore,
    max: { ...SCORE_MAX },
  };

  const score =
    robotsScore +
    sitemapScore +
    llmsScore +
    orgScore +
    clarityScore +
    technicalScore;

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    breakdown,
    findings,
    recommendations,
  };
}

function scoreRobots(
  robots: RobotsAuditResult,
  findings: Finding[],
  recommendations: string[],
): number {
  let points = 0;
  const max = SCORE_MAX.robots;

  if (robots.error && !robots.found) {
    findings.push({
      id: "robots-error",
      category: "robots",
      title: "robots.txt unavailable",
      description: robots.error,
      severity: "error",
      points: 0,
    });
    recommendations.push(
      "Ensure /robots.txt is publicly reachable over HTTPS without server errors.",
    );
    return 0;
  }

  if (!robots.found) {
    findings.push({
      id: "robots-missing",
      category: "robots",
      title: "robots.txt not found",
      description:
        "No robots.txt was found. Crawlers will use default allow behavior, but explicit rules are clearer.",
      severity: "warning",
      points: 8,
    });
    recommendations.push(
      "Publish a robots.txt that declares your sitemap and intentional AI crawler policies.",
    );
    return 8;
  }

  findings.push({
    id: "robots-reachable",
    category: "robots",
    title: "robots.txt is reachable",
    description: `Fetched successfully (HTTP ${robots.statusCode}).`,
    severity: "pass",
    points: 10,
  });
  points += 10;

  const searchBot = robots.crawlers.find((c) => c.name === "OAI-SearchBot");
  const gptBot = robots.crawlers.find((c) => c.name === "GPTBot");
  const others = robots.crawlers.filter(
    (c) => c.name !== "OAI-SearchBot" && c.name !== "GPTBot",
  );

  if (searchBot?.status === "blocked") {
    findings.push({
      id: "robots-oai-search-blocked",
      category: "robots",
      title: "OAI-SearchBot is blocked",
      description: searchBot.details,
      severity: "warning",
      points: 0,
    });
    recommendations.push(
      "Review your robots.txt rules for OAI-SearchBot if you want to permit ChatGPT Search discovery.",
    );
  } else if (searchBot?.status === "allowed") {
    findings.push({
      id: "robots-oai-search-allowed",
      category: "robots",
      title: "OAI-SearchBot is allowed",
      description: searchBot.details,
      severity: "pass",
      points: 8,
    });
    points += 8;
  } else {
    findings.push({
      id: "robots-oai-search-unspecified",
      category: "robots",
      title: "OAI-SearchBot has no explicit rule",
      description:
        "No dedicated OAI-SearchBot rule was found. Wildcard or default behavior may still apply.",
      severity: "warning",
      points: 4,
    });
    points += 4;
  }

  if (gptBot?.status === "blocked") {
    findings.push({
      id: "robots-gptbot-blocked",
      category: "robots",
      title: "GPTBot is blocked",
      description: `${gptBot.details} Note: GPTBot is distinct from OAI-SearchBot.`,
      severity: "info",
      points: 2,
    });
    points += 2;
  } else if (gptBot?.status === "allowed") {
    findings.push({
      id: "robots-gptbot-allowed",
      category: "robots",
      title: "GPTBot is allowed",
      description: gptBot.details,
      severity: "pass",
      points: 3,
    });
    points += 3;
  } else {
    findings.push({
      id: "robots-gptbot-unspecified",
      category: "robots",
      title: "GPTBot has no dedicated rule",
      description: "No dedicated GPTBot rule found.",
      severity: "info",
      points: 2,
    });
    points += 2;
  }

  const blockedOthers = others.filter((c) => c.status === "blocked");
  const allowedOthers = others.filter((c) => c.status === "allowed");
  if (blockedOthers.length) {
    findings.push({
      id: "robots-other-blocked",
      category: "robots",
      title: "Some AI crawlers are blocked",
      description: blockedOthers.map((c) => `${c.name}: ${c.details}`).join("; "),
      severity: "info",
      points: 1,
    });
    points += 1;
  } else if (allowedOthers.length) {
    findings.push({
      id: "robots-other-ok",
      category: "robots",
      title: "Other AI crawlers are not blocked",
      description: allowedOthers.map((c) => c.name).join(", "),
      severity: "pass",
      points: 4,
    });
    points += 4;
  } else {
    findings.push({
      id: "robots-other-unspecified",
      category: "robots",
      title: "Other AI crawlers have no dedicated rules",
      description: "OAI-AdsBot, ClaudeBot, and/or Google-Extended are not explicitly listed.",
      severity: "info",
      points: 2,
    });
    points += 2;
  }

  return Math.min(max, points);
}

function scoreSitemap(
  sitemap: SitemapAuditResult,
  findings: Finding[],
  recommendations: string[],
): number {
  const max = SCORE_MAX.sitemap;
  let points = 0;

  if (sitemap.error && !sitemap.found) {
    findings.push({
      id: "sitemap-error",
      category: "sitemap",
      title: "Sitemap unavailable",
      description: sitemap.error,
      severity: "error",
      points: 0,
    });
    recommendations.push(
      "Add and expose an XML sitemap, then reference it from robots.txt where appropriate.",
    );
    return 0;
  }

  if (!sitemap.found) {
    findings.push({
      id: "sitemap-missing",
      category: "sitemap",
      title: "Sitemap not found",
      description: "/sitemap.xml was not found.",
      severity: "warning",
      points: 0,
    });
    recommendations.push(
      "Add and expose an XML sitemap, then reference it from robots.txt where appropriate.",
    );
    if (sitemap.robotsSitemapUrls.length > 0) {
      findings.push({
        id: "sitemap-robots-ref",
        category: "sitemap",
        title: "robots.txt references a sitemap",
        description: sitemap.robotsSitemapUrls.join(", "),
        severity: "info",
        points: 3,
      });
      return 3;
    }
    return 0;
  }

  findings.push({
    id: "sitemap-found",
    category: "sitemap",
    title: "Sitemap found",
    description: `HTTP ${sitemap.statusCode}; type: ${sitemap.kind ?? "unknown"}`,
    severity: "pass",
    points: 8,
  });
  points += 8;

  if (sitemap.validXml) {
    findings.push({
      id: "sitemap-valid",
      category: "sitemap",
      title: "Sitemap XML looks valid",
      description:
        sitemap.kind === "index"
          ? `Sitemap index with ${sitemap.nestedSitemapCount ?? 0} nested sitemap(s)`
          : `URL set with ${sitemap.urlCount ?? 0} URL(s)`,
      severity: "pass",
      points: 5,
    });
    points += 5;
  } else {
    findings.push({
      id: "sitemap-invalid",
      category: "sitemap",
      title: "Sitemap XML may be invalid",
      description: sitemap.error ?? "Could not validate sitemap XML.",
      severity: "warning",
      points: 1,
    });
    points += 1;
    recommendations.push("Validate your sitemap XML against the sitemaps.org schema.");
  }

  if (sitemap.referencedInRobots || sitemap.robotsSitemapUrls.length > 0) {
    findings.push({
      id: "sitemap-robots-ref",
      category: "sitemap",
      title: "Sitemap referenced in robots.txt",
      description: "robots.txt declares one or more Sitemap directives.",
      severity: "pass",
      points: 2,
    });
    points += 2;
  } else {
    findings.push({
      id: "sitemap-no-robots-ref",
      category: "sitemap",
      title: "Sitemap not referenced in robots.txt",
      description: "Consider adding a Sitemap: directive to robots.txt.",
      severity: "info",
      points: 0,
    });
    recommendations.push(
      "Reference your XML sitemap from robots.txt with a Sitemap: directive.",
    );
  }

  return Math.min(max, points);
}

function scoreLlms(
  llms: LlmsAuditResult,
  findings: Finding[],
  recommendations: string[],
): number {
  const max = SCORE_MAX.llms;

  if (llms.found) {
    findings.push({
      id: "llms-found",
      category: "llms",
      title: "llms.txt found",
      description: `Optional discovery file present (${llms.contentLength ?? 0} characters).`,
      severity: "pass",
      points: max,
    });
    return max;
  }

  findings.push({
    id: "llms-missing",
    category: "llms",
    title: "llms.txt was not found",
    description:
      "This is an optional discovery/documentation signal. Its absence is not treated as a failure.",
    severity: "info",
    points: 0,
  });
  // Soft tip only — not a requirement
  if (!llms.error) {
    recommendations.push(
      "Optionally publish /llms.txt to document how AI systems may use your site content.",
    );
  }
  return 0;
}

function scoreOrganization(
  org: OrganizationAuditResult,
  findings: Finding[],
  recommendations: string[],
): number {
  const max = SCORE_MAX.organization;

  if (org.status === "invalid") {
    findings.push({
      id: "org-invalid",
      category: "organization",
      title: "Organization JSON-LD invalid",
      description: org.error ?? (org.parseErrors.join(" ") || "Malformed JSON-LD."),
      severity: "warning",
      points: 3,
    });
    recommendations.push(
      "Fix malformed JSON-LD so Organization structured data can be parsed.",
    );
    return 3;
  }

  if (org.status === "missing") {
    findings.push({
      id: "org-missing",
      category: "organization",
      title: "Organization schema missing",
      description: "No Organization (or related) JSON-LD entity was detected on the page.",
      severity: "warning",
      points: 0,
    });
    recommendations.push(
      "Consider adding valid Organization JSON-LD with your canonical company name and URL.",
    );
    return 0;
  }

  let points = 12;
  findings.push({
    id: "org-found",
    category: "organization",
    title: "Organization schema found",
    description: `Detected type: ${org.fields?.type ?? "Organization"}`,
    severity: "pass",
    points: 12,
  });

  if (org.fields?.name) {
    points += 3;
    findings.push({
      id: "org-name",
      category: "organization",
      title: "Organization name present",
      description: org.fields.name,
      severity: "pass",
      points: 3,
    });
  } else {
    recommendations.push("Include a name property on your Organization JSON-LD.");
  }

  if (org.fields?.url) {
    points += 2;
    findings.push({
      id: "org-url",
      category: "organization",
      title: "Organization URL present",
      description: org.fields.url,
      severity: "pass",
      points: 2,
    });
  }

  if (org.fields?.logo) {
    points += 2;
    findings.push({
      id: "org-logo",
      category: "organization",
      title: "Organization logo detected",
      description: "Logo property is present.",
      severity: "pass",
      points: 2,
    });
  }

  if (org.fields?.sameAs?.length) {
    points += 1;
    findings.push({
      id: "org-sameas",
      category: "organization",
      title: "sameAs profiles detected",
      description: `${org.fields.sameAs.length} profile URL(s)`,
      severity: "pass",
      points: 1,
    });
  }

  return Math.min(max, points);
}

function scorePageClarity(
  clarity: PageClarityResult,
  findings: Finding[],
  recommendations: string[],
): number {
  const max = SCORE_MAX.pageClarity;
  let points = 0;

  // Title — 7 pts
  if (!clarity.title.exists || clarity.title.empty) {
    findings.push({
      id: "clarity-title-missing",
      category: "pageClarity",
      title: "HTML title missing",
      description: "The page has no usable <title>.",
      severity: "error",
      points: 0,
    });
    recommendations.push("Add a descriptive HTML title.");
  } else if (!clarity.title.reasonable) {
    findings.push({
      id: "clarity-title-length",
      category: "pageClarity",
      title: "Title length may be suboptimal",
      description: `Title is ${clarity.title.length} characters (typically 15–70 is a useful range).`,
      severity: "info",
      points: 5,
    });
    points += 5;
  } else {
    findings.push({
      id: "clarity-title-ok",
      category: "pageClarity",
      title: "Title present",
      description: clarity.title.value ?? "",
      severity: "pass",
      points: 7,
    });
    points += 7;
  }

  // Meta description — 5 pts
  if (!clarity.metaDescription.exists || clarity.metaDescription.empty) {
    findings.push({
      id: "clarity-desc-missing",
      category: "pageClarity",
      title: "Meta description missing",
      description: "No meta description was found.",
      severity: "warning",
      points: 0,
    });
    recommendations.push("Add a concise meta description summarizing the page.");
  } else {
    findings.push({
      id: "clarity-desc-ok",
      category: "pageClarity",
      title: "Meta description present",
      description: `${clarity.metaDescription.length} characters`,
      severity: "pass",
      points: 5,
    });
    points += 5;
  }

  // Canonical — 4 pts
  if (clarity.canonical.status === "missing") {
    findings.push({
      id: "clarity-canonical-missing",
      category: "pageClarity",
      title: "Canonical URL missing",
      description: "No rel=canonical link was found.",
      severity: "warning",
      points: 0,
    });
    recommendations.push(
      "Consider adding a canonical URL to clarify the preferred page URL.",
    );
  } else if (clarity.canonical.status === "invalid") {
    findings.push({
      id: "clarity-canonical-invalid",
      category: "pageClarity",
      title: "Canonical URL invalid",
      description: clarity.canonical.value ?? "Invalid canonical href.",
      severity: "warning",
      points: 1,
    });
    points += 1;
    recommendations.push("Fix the canonical URL so it resolves to a valid http(s) address.");
  } else if (clarity.canonical.status === "different") {
    findings.push({
      id: "clarity-canonical-different",
      category: "pageClarity",
      title: "Canonical differs from requested URL",
      description: `Canonical: ${clarity.canonical.value}`,
      severity: "info",
      points: 3,
    });
    points += 3;
  } else {
    findings.push({
      id: "clarity-canonical-ok",
      category: "pageClarity",
      title: "Canonical URL present",
      description: clarity.canonical.value ?? "",
      severity: "pass",
      points: 4,
    });
    points += 4;
  }

  // H1 — 4 pts
  if (clarity.h1.status === "none") {
    findings.push({
      id: "clarity-h1-missing",
      category: "pageClarity",
      title: "No H1 found",
      description: "The page has zero H1 headings.",
      severity: "warning",
      points: 0,
    });
    recommendations.push("Add a clear H1 that states the primary topic of the page.");
  } else if (clarity.h1.status === "multiple") {
    findings.push({
      id: "clarity-h1-multiple",
      category: "pageClarity",
      title: "Multiple H1 elements",
      description: `Found ${clarity.h1.count} H1s. HTML5 permits multiple contextual headings; ensure the primary topic is still clear.`,
      severity: "info",
      points: 3,
    });
    points += 3;
  } else {
    findings.push({
      id: "clarity-h1-ok",
      category: "pageClarity",
      title: "Single H1 found",
      description: clarity.h1.texts[0] ?? "",
      severity: "pass",
      points: 4,
    });
    points += 4;
  }

  // Lang — 2 pts
  if (clarity.lang.present) {
    findings.push({
      id: "clarity-lang-ok",
      category: "pageClarity",
      title: "HTML lang attribute present",
      description: `lang="${clarity.lang.value}"`,
      severity: "pass",
      points: 2,
    });
    points += 2;
  } else {
    findings.push({
      id: "clarity-lang-missing",
      category: "pageClarity",
      title: "HTML lang attribute missing",
      description: "Declare the document language on the <html> element.",
      severity: "info",
      points: 0,
    });
    recommendations.push('Add a lang attribute to the <html> element (e.g. lang="en").');
  }

  // Viewport — 1 pt
  if (clarity.viewport.present) {
    points += 1;
    findings.push({
      id: "clarity-viewport-ok",
      category: "pageClarity",
      title: "Viewport meta present",
      description: "Mobile viewport meta tag detected.",
      severity: "pass",
      points: 1,
    });
  } else {
    findings.push({
      id: "clarity-viewport-missing",
      category: "pageClarity",
      title: "Viewport meta missing",
      description: "No viewport meta tag was found.",
      severity: "info",
      points: 0,
    });
  }

  // Robots meta — 2 pts (penalty if noindex)
  if (clarity.robotsMeta.noindex) {
    findings.push({
      id: "clarity-robots-noindex",
      category: "pageClarity",
      title: "Page has noindex",
      description: `robots meta: ${clarity.robotsMeta.value}`,
      severity: "error",
      points: 0,
    });
    recommendations.push(
      "Remove noindex if you want this page discoverable by search and AI systems.",
    );
  } else if (clarity.robotsMeta.present) {
    findings.push({
      id: "clarity-robots-meta",
      category: "pageClarity",
      title: "Robots meta present",
      description: clarity.robotsMeta.value ?? "",
      severity: "pass",
      points: 2,
    });
    points += 2;
  } else {
    findings.push({
      id: "clarity-robots-meta-default",
      category: "pageClarity",
      title: "No restrictive robots meta",
      description: "No robots meta tag found (default index/follow assumed).",
      severity: "pass",
      points: 2,
    });
    points += 2;
  }

  return Math.min(max, points);
}

function scoreTechnical(
  technical: TechnicalSignals,
  findings: Finding[],
  recommendations: string[],
): number {
  const max = SCORE_MAX.technical;
  let points = 0;

  if (technical.error && !technical.statusCode) {
    findings.push({
      id: "tech-fetch-error",
      category: "technical",
      title: "Page fetch failed",
      description: technical.error,
      severity: "error",
      points: 0,
    });
    return 0;
  }

  if (technical.https) {
    findings.push({
      id: "tech-https",
      category: "technical",
      title: "HTTPS enabled",
      description: "The audited URL uses HTTPS.",
      severity: "pass",
      points: 3,
    });
    points += 3;
  } else {
    findings.push({
      id: "tech-http",
      category: "technical",
      title: "Not using HTTPS",
      description: "Prefer HTTPS for crawlable public sites.",
      severity: "warning",
      points: 0,
    });
    recommendations.push("Serve the site over HTTPS.");
  }

  if (technical.statusCode && technical.statusCode >= 200 && technical.statusCode < 400) {
    findings.push({
      id: "tech-status",
      category: "technical",
      title: "HTTP status OK",
      description: `HTTP ${technical.statusCode}`,
      severity: "pass",
      points: 3,
    });
    points += 3;
  } else {
    findings.push({
      id: "tech-status-bad",
      category: "technical",
      title: "Unexpected HTTP status",
      description: `HTTP ${technical.statusCode ?? "unknown"}`,
      severity: "error",
      points: 0,
    });
  }

  if (technical.xRobotsTag?.toLowerCase().includes("noindex")) {
    findings.push({
      id: "tech-xrobots-noindex",
      category: "technical",
      title: "X-Robots-Tag includes noindex",
      description: technical.xRobotsTag,
      severity: "error",
      points: 0,
    });
    recommendations.push("Remove noindex from X-Robots-Tag if the page should be discoverable.");
  } else {
    points += 2;
    findings.push({
      id: "tech-xrobots-ok",
      category: "technical",
      title: "No blocking X-Robots-Tag",
      description: technical.xRobotsTag
        ? `X-Robots-Tag: ${technical.xRobotsTag}`
        : "No X-Robots-Tag header.",
      severity: "pass",
      points: 2,
    });
  }

  if (technical.hasStructuredData) {
    points += 2;
    findings.push({
      id: "tech-jsonld",
      category: "technical",
      title: "Structured data present",
      description: "At least one application/ld+json block was found.",
      severity: "pass",
      points: 2,
    });
  } else {
    findings.push({
      id: "tech-jsonld-missing",
      category: "technical",
      title: "No JSON-LD detected",
      description: "No application/ld+json script blocks were found on the page.",
      severity: "info",
      points: 0,
    });
  }

  return Math.min(max, points);
}

export function summarizeFindings(findings: Finding[]): AuditReport["summary"] {
  return {
    passed: findings.filter((f) => f.severity === "pass").length,
    warnings: findings.filter((f) => f.severity === "warning").length,
    errors: findings.filter((f) => f.severity === "error").length,
    informational: findings.filter((f) => f.severity === "info").length,
  };
}
