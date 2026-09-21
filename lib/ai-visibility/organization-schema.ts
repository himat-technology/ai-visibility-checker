import type {
  OrganizationAuditResult,
  OrganizationFields,
  OrganizationStatus,
} from "@/types/ai-visibility";

const ORG_TYPES = new Set([
  "organization",
  "corporation",
  "localbusiness",
  "professionalservice",
  "store",
  "ngo",
  "governmentorganization",
  "educationalorganization",
  "sportsorganization",
  "medicalorganization",
  "newsmediaorganization",
]);

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function typeList(node: Record<string, unknown>): string[] {
  const t = node["@type"];
  return asArray(t).map((x) => String(x));
}

function isOrgType(types: string[]): boolean {
  return types.some((t) => {
    const local = t.includes("/") ? t.split("/").pop()! : t;
    return ORG_TYPES.has(local.toLowerCase());
  });
}

function extractString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    if (typeof obj["@value"] === "string") return obj["@value"].trim();
    if (typeof obj.name === "string") return obj.name.trim();
    if (typeof obj.url === "string") return obj.url.trim();
    if (typeof obj.contentUrl === "string") return obj.contentUrl.trim();
  }
  return null;
}

function extractSameAs(value: unknown): string[] {
  return asArray(value)
    .map((v) => extractString(v))
    .filter((v): v is string => Boolean(v));
}

function extractAddress(value: unknown): string | null {
  if (typeof value === "string") return value.trim() || null;
  if (!value || typeof value !== "object") return null;
  const obj = value as Record<string, unknown>;
  if (typeof obj.streetAddress === "string" || typeof obj.addressLocality === "string") {
    const parts = [
      obj.streetAddress,
      obj.addressLocality,
      obj.addressRegion,
      obj.postalCode,
      obj.addressCountry,
    ]
      .map((p) => (typeof p === "string" ? p : null))
      .filter(Boolean);
    return parts.length ? parts.join(", ") : null;
  }
  return extractString(obj);
}

function extractLogo(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return null;
  const obj = value as Record<string, unknown>;
  return (
    extractString(obj.url) ||
    extractString(obj.contentUrl) ||
    extractString(obj["@id"]) ||
    null
  );
}

function nodeToFields(node: Record<string, unknown>): OrganizationFields {
  const types = typeList(node);
  const primary =
    types.find((t) => {
      const local = t.includes("/") ? t.split("/").pop()! : t;
      return ORG_TYPES.has(local.toLowerCase());
    }) ?? types[0] ?? null;

  return {
    name: extractString(node.name),
    url: extractString(node.url),
    logo: extractLogo(node.logo),
    sameAs: extractSameAs(node.sameAs),
    address: extractAddress(node.address),
    telephone: extractString(node.telephone),
    description: extractString(node.description),
    type: primary,
  };
}

function walkNodes(
  data: unknown,
  out: Record<string, unknown>[],
  types: string[],
): void {
  if (data == null) return;

  if (Array.isArray(data)) {
    for (const item of data) walkNodes(item, out, types);
    return;
  }

  if (typeof data !== "object") return;
  const node = data as Record<string, unknown>;

  if (node["@graph"]) {
    walkNodes(node["@graph"], out, types);
  }

  const t = typeList(node);
  if (t.length) {
    types.push(...t);
    out.push(node);
  }

  // Also walk common nested properties that may wrap Organization
  for (const key of ["mainEntity", "publisher", "author", "about", "provider"]) {
    if (node[key]) walkNodes(node[key], out, types);
  }
}

export function parseOrganizationFromJsonLdBlocks(
  blocks: string[],
): OrganizationAuditResult {
  const parseErrors: string[] = [];
  const allNodes: Record<string, unknown>[] = [];
  const rawTypesFound: string[] = [];

  if (blocks.length === 0) {
    return {
      status: "missing",
      fields: null,
      rawTypesFound: [],
      parseErrors: [],
      error: null,
    };
  }

  let anyParsed = false;

  for (const block of blocks) {
    try {
      const cleaned = block
        .replace(/^\uFEFF/, "")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .trim();
      if (!cleaned) continue;
      const data = JSON.parse(cleaned) as unknown;
      anyParsed = true;
      walkNodes(data, allNodes, rawTypesFound);
    } catch {
      parseErrors.push("One or more JSON-LD blocks could not be parsed as JSON.");
    }
  }

  const orgNodes = allNodes.filter((n) => isOrgType(typeList(n)));

  if (orgNodes.length === 0) {
    let status: OrganizationStatus = "missing";
    if (!anyParsed && blocks.length > 0) status = "invalid";
    else if (parseErrors.length && !anyParsed) status = "invalid";

    return {
      status,
      fields: null,
      rawTypesFound: [...new Set(rawTypesFound)],
      parseErrors,
      error: status === "invalid" ? "JSON-LD present but invalid" : null,
    };
  }

  // Prefer the richest node (most populated fields)
  const scored = orgNodes.map((n) => {
    const fields = nodeToFields(n);
    const score =
      (fields.name ? 3 : 0) +
      (fields.url ? 2 : 0) +
      (fields.logo ? 1 : 0) +
      (fields.sameAs.length ? 1 : 0) +
      (fields.address ? 1 : 0) +
      (fields.telephone ? 1 : 0) +
      (fields.description ? 1 : 0);
    return { fields, score };
  });
  scored.sort((a, b) => b.score - a.score);

  return {
    status: "found",
    fields: scored[0].fields,
    rawTypesFound: [...new Set(rawTypesFound)],
    parseErrors,
    error: null,
  };
}

export function extractJsonLdBlocks(html: string): string[] {
  const blocks: string[] = [];
  const re =
    /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    blocks.push(match[1].trim());
  }
  return blocks;
}

export function auditOrganizationSchema(html: string): OrganizationAuditResult {
  const blocks = extractJsonLdBlocks(html);
  return parseOrganizationFromJsonLdBlocks(blocks);
}
