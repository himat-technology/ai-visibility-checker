export type FindingSeverity = "pass" | "info" | "warning" | "error";

export type FindingCategory =
  | "robots"
  | "sitemap"
  | "llms"
  | "organization"
  | "pageClarity"
  | "technical"
  | "scoring";

export interface Finding {
  id: string;
  category: FindingCategory;
  title: string;
  description: string;
  severity: FindingSeverity;
  points?: number;
}

export type CrawlerStatus =
  | "allowed"
  | "blocked"
  | "not_specified"
  | "unknown";

export interface CrawlerResult {
  name: string;
  userAgent: string;
  mentioned: boolean;
  status: CrawlerStatus;
  details: string;
  purpose: string;
}

export interface RobotsAuditResult {
  url: string;
  found: boolean;
  statusCode: number | null;
  contentType: string | null;
  rawContent: string | null;
  sitemaps: string[];
  crawlers: CrawlerResult[];
  parseError: string | null;
  error: string | null;
}

export type SitemapKind = "urlset" | "index" | "unknown" | null;

export interface SitemapAuditResult {
  url: string;
  found: boolean;
  statusCode: number | null;
  contentType: string | null;
  validXml: boolean;
  kind: SitemapKind;
  urlCount: number | null;
  nestedSitemapCount: number | null;
  referencedInRobots: boolean;
  robotsSitemapUrls: string[];
  truncated: boolean;
  error: string | null;
}

export interface LlmsAuditResult {
  url: string;
  found: boolean;
  statusCode: number | null;
  contentType: string | null;
  contentLength: number | null;
  preview: string | null;
  error: string | null;
}

export type OrganizationStatus = "found" | "missing" | "invalid";

export interface OrganizationFields {
  name: string | null;
  url: string | null;
  logo: string | null;
  sameAs: string[];
  address: string | null;
  telephone: string | null;
  description: string | null;
  type: string | null;
}

export interface OrganizationAuditResult {
  status: OrganizationStatus;
  fields: OrganizationFields | null;
  rawTypesFound: string[];
  parseErrors: string[];
  error: string | null;
}

export interface TitleCheck {
  exists: boolean;
  empty: boolean;
  value: string | null;
  length: number;
  reasonable: boolean;
}

export interface MetaDescriptionCheck {
  exists: boolean;
  empty: boolean;
  value: string | null;
  length: number;
}

export interface CanonicalCheck {
  present: boolean;
  value: string | null;
  valid: boolean;
  matchesRequest: boolean | null;
  status: "present" | "missing" | "invalid" | "different";
}

export interface H1Check {
  count: number;
  texts: string[];
  status: "none" | "single" | "multiple";
}

export interface LangCheck {
  present: boolean;
  value: string | null;
}

export interface ViewportCheck {
  present: boolean;
  value: string | null;
}

export interface RobotsMetaCheck {
  present: boolean;
  value: string | null;
  noindex: boolean;
  nofollow: boolean;
  otherRestrictions: string[];
}

export interface OpenGraphCheck {
  title: string | null;
  description: string | null;
  url: string | null;
  image: string | null;
}

export interface PageClarityResult {
  title: TitleCheck;
  metaDescription: MetaDescriptionCheck;
  canonical: CanonicalCheck;
  h1: H1Check;
  lang: LangCheck;
  viewport: ViewportCheck;
  robotsMeta: RobotsMetaCheck;
  openGraph: OpenGraphCheck;
}

export interface TechnicalSignals {
  https: boolean;
  requestedUrl: string;
  finalUrl: string;
  redirected: boolean;
  statusCode: number | null;
  contentType: string | null;
  responseTimeMs: number | null;
  htmlSizeBytes: number | null;
  xRobotsTag: string | null;
  hasStructuredData: boolean;
  error: string | null;
}

export interface ScoreBreakdown {
  robots: number;
  sitemap: number;
  llms: number;
  organization: number;
  pageClarity: number;
  technical: number;
  max: {
    robots: number;
    sitemap: number;
    llms: number;
    organization: number;
    pageClarity: number;
    technical: number;
  };
}

export interface AuditSummary {
  passed: number;
  warnings: number;
  errors: number;
  informational: number;
}

export interface AuditReport {
  url: string;
  timestamp: string;
  score: number;
  scoreLabel: string;
  scoreDisclaimer: string;
  breakdown: ScoreBreakdown;
  summary: AuditSummary;
  robots: RobotsAuditResult;
  sitemap: SitemapAuditResult;
  llms: LlmsAuditResult;
  organization: OrganizationAuditResult;
  pageClarity: PageClarityResult;
  technical: TechnicalSignals;
  findings: Finding[];
  recommendations: string[];
}

export interface AuditApiSuccess {
  success: true;
  report: AuditReport;
}

export interface AuditApiFailure {
  success: false;
  error: string;
  code?: string;
}

export type AuditApiResponse = AuditApiSuccess | AuditApiFailure;

export const AI_CRAWLERS = [
  {
    name: "OAI-SearchBot",
    userAgent: "OAI-SearchBot",
    purpose: "OpenAI ChatGPT Search discovery crawler",
  },
  {
    name: "OAI-AdsBot",
    userAgent: "OAI-AdsBot",
    purpose: "OpenAI advertising-related crawler",
  },
  {
    name: "GPTBot",
    userAgent: "GPTBot",
    purpose: "OpenAI training / model crawler (distinct from OAI-SearchBot)",
  },
  {
    name: "ClaudeBot",
    userAgent: "ClaudeBot",
    purpose: "Anthropic Claude crawler",
  },
  {
    name: "Google-Extended",
    userAgent: "Google-Extended",
    purpose: "Google AI / Gemini training opt-out token",
  },
] as const;

export const SCORE_MAX = {
  robots: 25,
  sitemap: 15,
  llms: 5,
  organization: 20,
  pageClarity: 25,
  technical: 10,
} as const;
