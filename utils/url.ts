/**
 * URL normalization and SSRF-oriented hostname helpers.
 */

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
  "metadata",
  "instance-data",
]);

const BLOCKED_HOSTNAME_SUFFIXES = [
  ".localhost",
  ".local",
  ".internal",
  ".intranet",
  ".corp",
  ".home",
  ".lan",
];

export class UrlValidationError extends Error {
  code: string;

  constructor(message: string, code = "INVALID_URL") {
    super(message);
    this.name = "UrlValidationError";
    this.code = code;
  }
}

export function normalizeUrl(input: string): URL {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new UrlValidationError("Please enter a website URL.");
  }

  let candidate = trimmed;
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new UrlValidationError("Enter a valid HTTP or HTTPS URL.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new UrlValidationError(
      "Only http and https URLs are allowed.",
      "UNSUPPORTED_PROTOCOL",
    );
  }

  if (!parsed.hostname || parsed.hostname.includes(" ")) {
    throw new UrlValidationError("URL hostname is invalid.");
  }

  // Normalize trailing slash on pathname root only; keep path otherwise
  if (parsed.pathname !== "/" && parsed.pathname.endsWith("/")) {
    parsed.pathname = parsed.pathname.replace(/\/+$/, "");
  }

  assertSafeHostname(parsed.hostname);
  return parsed;
}

export function assertSafeHostname(hostname: string): void {
  const host = hostname.toLowerCase().replace(/\.$/, "");

  if (!host) {
    throw new UrlValidationError("Hostname is empty.", "SSRF_BLOCKED");
  }

  if (BLOCKED_HOSTNAMES.has(host)) {
    throw new UrlValidationError(
      "Requests to local or internal hosts are not allowed.",
      "SSRF_BLOCKED",
    );
  }

  for (const suffix of BLOCKED_HOSTNAME_SUFFIXES) {
    if (host.endsWith(suffix)) {
      throw new UrlValidationError(
        "Requests to internal hostnames are not allowed.",
        "SSRF_BLOCKED",
      );
    }
  }

  if (host === "0.0.0.0" || host === "::" || host === "[::]") {
    throw new UrlValidationError(
      "Requests to unspecified addresses are not allowed.",
      "SSRF_BLOCKED",
    );
  }

  const bare = host.replace(/^\[|\]$/g, "");
  if (isPrivateOrReservedIp(bare)) {
    throw new UrlValidationError(
      "Requests to private or link-local IP addresses are not allowed.",
      "SSRF_BLOCKED",
    );
  }
}

export function isPrivateOrReservedIp(ip: string): boolean {
  // IPv4
  const ipv4 = ip.match(
    /^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)$/,
  );
  if (ipv4) {
    const parts = ip.split(".").map(Number);
    const [a, b] = parts;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true; // link-local / cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
    if (a >= 224) return true; // multicast / reserved
    return false;
  }

  // IPv6 (simplified)
  const lower = ip.toLowerCase();
  if (lower === "::1" || lower === "0:0:0:0:0:0:0:1") return true;
  if (lower === "::" || lower === "0:0:0:0:0:0:0:0") return true;
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // ULA
  if (lower.startsWith("fe80")) return true; // link-local
  if (lower.startsWith("ff")) return true; // multicast
  // IPv4-mapped IPv6
  const mapped = lower.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateOrReservedIp(mapped[1]);
  return false;
}

export function originFromUrl(url: URL): string {
  return `${url.protocol}//${url.host}`;
}

export function joinUrl(base: string, path: string): string {
  const u = new URL(path, base.endsWith("/") ? base : `${base}/`);
  return u.toString();
}
