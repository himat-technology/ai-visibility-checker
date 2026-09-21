import * as cheerio from "cheerio";
import type {
  CanonicalCheck,
  H1Check,
  PageClarityResult,
  RobotsMetaCheck,
} from "@/types/ai-visibility";

export function auditPageClarity(
  html: string,
  requestedUrl: string,
  finalUrl?: string,
): PageClarityResult {
  const $ = cheerio.load(html);

  const titleText = $("title").first().text().replace(/\s+/g, " ").trim();
  const titleExists = $("title").length > 0;
  const titleLength = titleText.length;

  const metaDesc =
    $('meta[name="description"]').attr("content")?.replace(/\s+/g, " ").trim() ??
    null;
  const metaExists = $('meta[name="description"]').length > 0;

  const canonicalHref =
    $('link[rel="canonical"]').attr("href")?.trim() ?? null;
  const canonical = evaluateCanonical(canonicalHref, requestedUrl, finalUrl);

  const h1Els = $("h1");
  const h1Texts = h1Els
    .map((_, el) => $(el).text().replace(/\s+/g, " ").trim())
    .get()
    .filter(Boolean)
    .slice(0, 10);
  const h1: H1Check = {
    count: h1Els.length,
    texts: h1Texts,
    status: h1Els.length === 0 ? "none" : h1Els.length === 1 ? "single" : "multiple",
  };

  const lang = $("html").attr("lang")?.trim() ?? null;
  const viewport = $('meta[name="viewport"]').attr("content")?.trim() ?? null;

  const robotsContent =
    $('meta[name="robots"]').attr("content")?.trim() ??
    $('meta[name="googlebot"]').attr("content")?.trim() ??
    null;
  const robotsMeta = evaluateRobotsMeta(robotsContent);

  const og = {
    title: $('meta[property="og:title"]').attr("content")?.trim() ?? null,
    description:
      $('meta[property="og:description"]').attr("content")?.trim() ?? null,
    url: $('meta[property="og:url"]').attr("content")?.trim() ?? null,
    image: $('meta[property="og:image"]').attr("content")?.trim() ?? null,
  };

  return {
    title: {
      exists: titleExists,
      empty: titleExists && titleLength === 0,
      value: titleText || null,
      length: titleLength,
      reasonable: titleLength >= 15 && titleLength <= 70,
    },
    metaDescription: {
      exists: metaExists,
      empty: metaExists && !metaDesc,
      value: metaDesc,
      length: metaDesc?.length ?? 0,
    },
    canonical,
    h1,
    lang: { present: Boolean(lang), value: lang },
    viewport: { present: Boolean(viewport), value: viewport },
    robotsMeta,
    openGraph: og,
  };
}

function evaluateCanonical(
  href: string | null,
  requestedUrl: string,
  finalUrl?: string,
): CanonicalCheck {
  if (!href) {
    return {
      present: false,
      value: null,
      valid: false,
      matchesRequest: null,
      status: "missing",
    };
  }

  let absolute: URL;
  try {
    absolute = new URL(href, finalUrl || requestedUrl);
  } catch {
    return {
      present: true,
      value: href,
      valid: false,
      matchesRequest: false,
      status: "invalid",
    };
  }

  if (absolute.protocol !== "http:" && absolute.protocol !== "https:") {
    return {
      present: true,
      value: absolute.toString(),
      valid: false,
      matchesRequest: false,
      status: "invalid",
    };
  }

  const compareTo = finalUrl || requestedUrl;
  let matches = false;
  try {
    const a = new URL(absolute.toString());
    const b = new URL(compareTo);
    matches =
      a.hostname === b.hostname &&
      normalizePath(a.pathname) === normalizePath(b.pathname);
  } catch {
    matches = false;
  }

  return {
    present: true,
    value: absolute.toString(),
    valid: true,
    matchesRequest: matches,
    status: matches ? "present" : "different",
  };
}

function normalizePath(pathname: string): string {
  if (pathname === "/") return "/";
  return pathname.replace(/\/+$/, "");
}

function evaluateRobotsMeta(content: string | null): RobotsMetaCheck {
  if (!content) {
    return {
      present: false,
      value: null,
      noindex: false,
      nofollow: false,
      otherRestrictions: [],
    };
  }

  const tokens = content
    .split(/[,;\s]+/)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  const noindex = tokens.includes("noindex");
  const nofollow = tokens.includes("nofollow");
  const otherRestrictions = tokens.filter(
    (t) =>
      !["index", "follow", "noindex", "nofollow", "all", "none"].includes(t) &&
      t.length > 0,
  );
  if (tokens.includes("none")) {
    return {
      present: true,
      value: content,
      noindex: true,
      nofollow: true,
      otherRestrictions,
    };
  }

  return {
    present: true,
    value: content,
    noindex,
    nofollow,
    otherRestrictions,
  };
}
