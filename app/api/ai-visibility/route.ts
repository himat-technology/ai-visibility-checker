import { NextResponse } from "next/server";
import { runAudit } from "@/lib/ai-visibility/auditor";
import { auditRequestSchema } from "@/lib/ai-visibility/validators";
import { UrlValidationError } from "@/utils/url";
import { SafeFetchError } from "@/lib/ai-visibility/fetcher";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Request body must be valid JSON.", code: "BAD_REQUEST" },
        { status: 400 },
      );
    }

    const parsed = auditRequestSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid request.";
      return NextResponse.json(
        { success: false, error: message, code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }

    const report = await runAudit(parsed.data.url);

    return NextResponse.json({ success: true, report });
  } catch (err) {
    if (err instanceof UrlValidationError) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.code },
        { status: 400 },
      );
    }
    if (err instanceof SafeFetchError) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.code },
        { status: 422 },
      );
    }

    console.error("[ai-visibility] audit failed:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Unable to complete the audit. Please try again.",
        code: "AUDIT_FAILED",
      },
      { status: 500 },
    );
  }
}
