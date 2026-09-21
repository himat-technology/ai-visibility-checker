import dns from "dns/promises";
import {
  assertSafeHostname,
  isPrivateOrReservedIp,
  UrlValidationError,
} from "@/utils/url";

export const DEFAULT_TIMEOUT_MS = 12_000;
export const MAX_RESPONSE_BYTES = 2_000_000; // 2 MB
export const MAX_REDIRECTS = 5;

export const DEFAULT_USER_AGENT =
  process.env.AUDIT_USER_AGENT ||
  "HimatAIVisibilityChecker/1.0 (+https://himat.tech; technical SEO audit)";

export interface SafeFetchResult {
  ok: boolean;
  status: number;
  statusText: string;
  url: string;
  finalUrl: string;
  redirected: boolean;
  headers: Headers;
  contentType: string | null;
  bodyText: string;
  bodyBytes: number;
  responseTimeMs: number;
}

export class SafeFetchError extends Error {
  code: string;
  status?: number;

  constructor(message: string, code: string, status?: number) {
    super(message);
    this.name = "SafeFetchError";
    this.code = code;
    this.status = status;
  }
}

async function resolveAndAssertSafe(hostname: string): Promise<void> {
  assertSafeHostname(hostname);

  let addresses: string[];
  try {
    const result = await dns.lookup(hostname, { all: true, verbatim: true });
    addresses = result.map((r) => r.address);
  } catch {
    throw new SafeFetchError(
      "Could not resolve the hostname. Check the URL and try again.",
      "DNS_FAILURE",
    );
  }

  if (addresses.length === 0) {
    throw new SafeFetchError("Hostname did not resolve to any address.", "DNS_FAILURE");
  }

  for (const addr of addresses) {
    if (isPrivateOrReservedIp(addr)) {
      throw new SafeFetchError(
        "Resolved address is private or reserved and cannot be fetched.",
        "SSRF_BLOCKED",
      );
    }
  }
}

function contentTypeAllowed(
  contentType: string | null,
  allowed: string[] | null,
): boolean {
  if (!allowed || allowed.length === 0) return true;
  if (!contentType) return true; // allow missing CT; caller may still parse
  const base = contentType.split(";")[0].trim().toLowerCase();
  return allowed.some((a) => base === a || base.endsWith(a) || base.includes(a));
}

export interface SafeFetchOptions {
  timeoutMs?: number;
  maxBytes?: number;
  maxRedirects?: number;
  method?: "GET" | "HEAD";
  accept?: string;
  allowedContentTypes?: string[] | null;
  signal?: AbortSignal;
}

/**
 * SSRF-hardened fetch: DNS resolve + private IP block, timeout,
 * redirect limit, response size cap, protocol check.
 */
export async function safeFetch(
  inputUrl: string,
  options: SafeFetchOptions = {},
): Promise<SafeFetchResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxBytes = options.maxBytes ?? MAX_RESPONSE_BYTES;
  const maxRedirects = options.maxRedirects ?? MAX_REDIRECTS;
  const method = options.method ?? "GET";

  let current = inputUrl;
  let redirectCount = 0;
  const started = Date.now();

  while (true) {
    let parsed: URL;
    try {
      parsed = new URL(current);
    } catch {
      throw new SafeFetchError("Invalid URL during fetch.", "INVALID_URL");
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new SafeFetchError("Only http/https allowed.", "UNSUPPORTED_PROTOCOL");
    }

    try {
      assertSafeHostname(parsed.hostname);
    } catch (err) {
      if (err instanceof UrlValidationError) {
        throw new SafeFetchError(err.message, err.code);
      }
      throw err;
    }

    await resolveAndAssertSafe(parsed.hostname);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const onOuterAbort = () => controller.abort();
    options.signal?.addEventListener("abort", onOuterAbort);

    try {
      const response = await fetch(parsed.toString(), {
        method,
        redirect: "manual",
        headers: {
          "User-Agent": DEFAULT_USER_AGENT,
          Accept: options.accept ?? "*/*",
          "Accept-Language": "en-US,en;q=0.9",
        },
        signal: controller.signal,
      });

      // Handle redirects manually so we can re-check each hop
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        if (!location) {
          throw new SafeFetchError("Redirect missing Location header.", "REDIRECT_ERROR");
        }
        redirectCount += 1;
        if (redirectCount > maxRedirects) {
          throw new SafeFetchError("Too many redirects.", "REDIRECT_LOOP");
        }
        current = new URL(location, parsed).toString();
        continue;
      }

      const contentType = response.headers.get("content-type");
      if (
        options.allowedContentTypes &&
        response.ok &&
        !contentTypeAllowed(contentType, options.allowedContentTypes)
      ) {
        // Still return body truncated for diagnostics, but mark via throw only for HTML expectation soft
      }

      const buffer = await readLimitedBody(response, maxBytes);
      const bodyText = new TextDecoder("utf-8", { fatal: false }).decode(buffer);

      return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        url: inputUrl,
        finalUrl: response.url || parsed.toString(),
        redirected: redirectCount > 0 || response.url !== parsed.toString(),
        headers: response.headers,
        contentType,
        bodyText,
        bodyBytes: buffer.byteLength,
        responseTimeMs: Date.now() - started,
      };
    } catch (err) {
      if (err instanceof SafeFetchError) throw err;
      if (err instanceof Error && err.name === "AbortError") {
        throw new SafeFetchError("The request timed out.", "TIMEOUT");
      }
      const message =
        err instanceof Error ? err.message.toLowerCase() : "unknown error";
      if (message.includes("certificate") || message.includes("ssl") || message.includes("tls")) {
        throw new SafeFetchError("SSL/TLS connection failed.", "SSL_ERROR");
      }
      throw new SafeFetchError(
        "Unable to fetch the URL. The remote server may be unreachable.",
        "FETCH_FAILED",
      );
    } finally {
      clearTimeout(timer);
      options.signal?.removeEventListener("abort", onOuterAbort);
    }
  }
}

async function readLimitedBody(
  response: Response,
  maxBytes: number,
): Promise<Uint8Array> {
  if (!response.body) {
    return new Uint8Array();
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > maxBytes) {
      try {
        await reader.cancel();
      } catch {
        /* ignore */
      }
      throw new SafeFetchError(
        "Response exceeded the maximum allowed size.",
        "RESPONSE_TOO_LARGE",
      );
    }
    chunks.push(value);
  }

  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

export function friendlyFetchError(err: unknown): { message: string; code: string } {
  if (err instanceof SafeFetchError) {
    return { message: err.message, code: err.code };
  }
  if (err instanceof UrlValidationError) {
    return { message: err.message, code: err.code };
  }
  return {
    message: "An unexpected error occurred while fetching the URL.",
    code: "UNKNOWN",
  };
}
