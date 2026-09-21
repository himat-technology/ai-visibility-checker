import type { LlmsAuditResult } from "@/types/ai-visibility";
import { friendlyFetchError, safeFetch } from "@/lib/ai-visibility/fetcher";
import { joinUrl } from "@/utils/url";

export async function auditLlms(origin: string): Promise<LlmsAuditResult> {
  const llmsUrl = joinUrl(origin, "/llms.txt");

  try {
    const res = await safeFetch(llmsUrl, {
      accept: "text/plain,*/*;q=0.8",
    });

    if (res.status === 404) {
      return {
        url: llmsUrl,
        found: false,
        statusCode: 404,
        contentType: res.contentType,
        contentLength: null,
        preview: null,
        error: null,
      };
    }

    if (!res.ok) {
      return {
        url: llmsUrl,
        found: false,
        statusCode: res.status,
        contentType: res.contentType,
        contentLength: null,
        preview: null,
        error: `llms.txt returned HTTP ${res.status}`,
      };
    }

    const text = res.bodyText.trim();
    return {
      url: res.finalUrl || llmsUrl,
      found: text.length > 0,
      statusCode: res.status,
      contentType: res.contentType,
      contentLength: text.length,
      preview: text.slice(0, 500) || null,
      error: text.length === 0 ? "llms.txt was empty" : null,
    };
  } catch (err) {
    const { message } = friendlyFetchError(err);
    return {
      url: llmsUrl,
      found: false,
      statusCode: null,
      contentType: null,
      contentLength: null,
      preview: null,
      error: message,
    };
  }
}
