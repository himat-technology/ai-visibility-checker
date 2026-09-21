import { NextResponse } from "next/server";
import { z } from "zod";
import { reportToPdfBuffer } from "@/utils/pdf";
import type { AuditReport } from "@/types/ai-visibility";

export const runtime = "nodejs";

const bodySchema = z.object({
  report: z.custom<AuditReport>(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid report payload." },
        { status: 400 },
      );
    }

    const buffer = await reportToPdfBuffer(parsed.data.report);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="ai-visibility-report.pdf"`,
      },
    });
  } catch (err) {
    console.error("[ai-visibility] pdf failed:", err);
    return NextResponse.json(
      { success: false, error: "Unable to generate PDF." },
      { status: 500 },
    );
  }
}
