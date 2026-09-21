import type { CrawlerResult, CrawlerStatus, RobotsAuditResult } from "@/types/ai-visibility";
import { AI_CRAWLERS } from "@/types/ai-visibility";
import { friendlyFetchError, safeFetch } from "@/lib/ai-visibility/fetcher";
import { joinUrl } from "@/utils/url";

interface RobotsRule {
  userAgents: string[];
  allow: string[];
  disallow: string[];
}

export interface ParsedRobots {
  groups: RobotsRule[];
  sitemaps: string[];
  malformed: boolean;
  parseNotes: string[];
}

/**
 * Parse robots.txt into groups. Handles common malformed input gracefully.
 */
export function parseRobotsTxt(content: string): ParsedRobots {
  const groups: RobotsRule[] = [];
  const sitemaps: string[] = [];
  const parseNotes: string[] = [];
  let current: RobotsRule | null = null;
  let malformed = false;

  const lines = content.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;

    const colon = line.indexOf(":");
    if (colon === -1) {
      malformed = true;
      parseNotes.push(`Skipped malformed line: ${rawLine.slice(0, 80)}`);
      continue;
    }

    const key = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();

    if (key === "user-agent") {
      if (!value) {
        malformed = true;
        continue;
      }
      // Start a new group when a User-agent follows Allow/Disallow rules
      if (!current || current.allow.length > 0 || current.disallow.length > 0) {
        current = { userAgents: [value.toLowerCase()], allow: [], disallow: [] };
        groups.push(current);
      } else {
        current.userAgents.push(value.toLowerCase());
      }
    } else if (key === "allow") {
      if (!current) {
        malformed = true;
        current = { userAgents: ["*"], allow: [], disallow: [] };
        groups.push(current);
      }
      current.allow.push(value);
    } else if (key === "disallow") {
      if (!current) {
        malformed = true;
        current = { userAgents: ["*"], allow: [], disallow: [] };
        groups.push(current);
      }
      current.disallow.push(value);
    } else if (key === "sitemap") {
      if (value) sitemaps.push(value);
    }
  }

  return { groups, sitemaps, malformed, parseNotes };
}

function pathMatches(pattern: string, path: string): boolean {
  if (pattern === "") return false;
  // Robots longest-match semantics simplified for site-root checks
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*");
  try {
    return new RegExp(`^${escaped}`).test(path);
  } catch {
    return path.startsWith(pattern);
  }
}

/**
 * Evaluate whether a bot is allowed to crawl path "/" (site root).
 */
export function evaluateCrawlerAccess(
  parsed: ParsedRobots,
  userAgent: string,
  path = "/",
): { status: CrawlerStatus; mentioned: boolean; details: string } {
  const ua = userAgent.toLowerCase();
  const specificGroups = parsed.groups.filter((g) =>
    g.userAgents.some((a) => a === ua),
  );
  const wildcardGroups = parsed.groups.filter((g) =>
    g.userAgents.some((a) => a === "*"),
  );

  const mentioned = specificGroups.length > 0;
  const groups = mentioned ? specificGroups : wildcardGroups;

  if (groups.length === 0) {
    return {
      status: "not_specified",
      mentioned: false,
      details: "No dedicated rule",
    };
  }

  // Collect matching allow/disallow with longest-match wins
  type Match = { type: "allow" | "disallow"; length: number; pattern: string };
  const matches: Match[] = [];

  for (const group of groups) {
    for (const pattern of group.allow) {
      if (pathMatches(pattern, path)) {
        matches.push({ type: "allow", length: pattern.length, pattern });
      }
    }
    for (const pattern of group.disallow) {
      if (pattern === "") continue; // empty Disallow = allow all
      if (pathMatches(pattern, path)) {
        matches.push({ type: "disallow", length: pattern.length, pattern });
      }
    }
  }

  if (matches.length === 0) {
    // Group exists but no path rule matched for "/"
    // If group only has Disallow: / that didn't match somehow, or empty rules
    const hasBlankDisallowOnly = groups.every(
      (g) =>
        g.disallow.every((d) => d === "") &&
        g.allow.length === 0 &&
        g.disallow.length > 0,
    );
    if (hasBlankDisallowOnly) {
      return {
        status: "allowed",
        mentioned,
        details: mentioned
          ? "Explicit group with empty Disallow (allow all)"
          : "Wildcard empty Disallow (allow all)",
      };
    }

    // Check for explicit Disallow: / which matches root
    const blocksRoot = groups.some((g) =>
      g.disallow.some((d) => d === "/" || pathMatches(d, path)),
    );
    if (blocksRoot) {
      return {
        status: "blocked",
        mentioned,
        details: mentioned
          ? "Disallow rule found"
          : "Blocked by wildcard Disallow rule",
      };
    }

    return {
      status: mentioned ? "allowed" : "not_specified",
      mentioned,
      details: mentioned
        ? "No blocking rule found"
        : "No dedicated rule",
    };
  }

  matches.sort((a, b) => b.length - a.length);
  const winner = matches[0];

  if (winner.type === "disallow") {
    return {
      status: "blocked",
      mentioned,
      details: mentioned
        ? `Disallow rule found (${winner.pattern || "/"})`
        : `Blocked by wildcard rule (${winner.pattern || "/"})`,
    };
  }

  return {
    status: "allowed",
    mentioned,
    details: mentioned
      ? `Allow rule found (${winner.pattern || "/"})`
      : `Allowed by wildcard rule (${winner.pattern || "/"})`,
  };
}

export function buildCrawlerMatrix(parsed: ParsedRobots): CrawlerResult[] {
  return AI_CRAWLERS.map((bot) => {
    const result = evaluateCrawlerAccess(parsed, bot.userAgent);
    return {
      name: bot.name,
      userAgent: bot.userAgent,
      mentioned: result.mentioned,
      status: result.status,
      details: result.details,
      purpose: bot.purpose,
    };
  });
}

export async function auditRobots(origin: string): Promise<RobotsAuditResult> {
  const robotsUrl = joinUrl(origin, "/robots.txt");

  try {
    const res = await safeFetch(robotsUrl, {
      accept: "text/plain,*/*;q=0.8",
      allowedContentTypes: null,
    });

    if (res.status === 404) {
      return {
        url: robotsUrl,
        found: false,
        statusCode: 404,
        contentType: res.contentType,
        rawContent: null,
        sitemaps: [],
        crawlers: AI_CRAWLERS.map((bot) => ({
          name: bot.name,
          userAgent: bot.userAgent,
          mentioned: false,
          status: "not_specified",
          details: "robots.txt not found — no crawler rules available",
          purpose: bot.purpose,
        })),
        parseError: null,
        error: null,
      };
    }

    if (!res.ok) {
      return {
        url: robotsUrl,
        found: false,
        statusCode: res.status,
        contentType: res.contentType,
        rawContent: null,
        sitemaps: [],
        crawlers: AI_CRAWLERS.map((bot) => ({
          name: bot.name,
          userAgent: bot.userAgent,
          mentioned: false,
          status: "unknown",
          details: `robots.txt returned HTTP ${res.status}`,
          purpose: bot.purpose,
        })),
        parseError: null,
        error: `robots.txt returned HTTP ${res.status}`,
      };
    }

    const parsed = parseRobotsTxt(res.bodyText);
    const crawlers = buildCrawlerMatrix(parsed);

    return {
      url: robotsUrl,
      found: true,
      statusCode: res.status,
      contentType: res.contentType,
      rawContent: res.bodyText.slice(0, 50_000),
      sitemaps: parsed.sitemaps,
      crawlers,
      parseError: parsed.malformed
        ? "Some lines in robots.txt were malformed and skipped."
        : null,
      error: null,
    };
  } catch (err) {
    const { message } = friendlyFetchError(err);
    return {
      url: robotsUrl,
      found: false,
      statusCode: null,
      contentType: null,
      rawContent: null,
      sitemaps: [],
      crawlers: AI_CRAWLERS.map((bot) => ({
        name: bot.name,
        userAgent: bot.userAgent,
        mentioned: false,
        status: "unknown",
        details: "Could not fetch robots.txt",
        purpose: bot.purpose,
      })),
      parseError: null,
      error: message,
    };
  }
}
