"use client";

import { useState } from "react";
import { Check, Copy, Download, FileJson, FileText } from "lucide-react";
import type { AuditReport } from "@/types/ai-visibility";
import { reportToExportJson, reportToMarkdown } from "@/utils/markdown";

interface ExportActionsProps {
  report: AuditReport;
}

export function ExportActions({ report }: ExportActionsProps) {
  const [copied, setCopied] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  function downloadBlob(content: string, filename: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleJson() {
    downloadBlob(
      reportToExportJson(report),
      "ai-visibility-report.json",
      "application/json",
    );
  }

  function handleMarkdown() {
    downloadBlob(
      reportToMarkdown(report),
      "ai-visibility-report.md",
      "text/markdown;charset=utf-8",
    );
  }

  async function handleCopyJson() {
    await navigator.clipboard.writeText(reportToExportJson(report));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handlePdf() {
    setPdfLoading(true);
    setPdfError(null);
    try {
      const res = await fetch("/api/ai-visibility/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report }),
      });
      if (!res.ok) {
        throw new Error("PDF generation failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ai-visibility-report.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setPdfError("Unable to generate PDF. Try JSON or Markdown instead.");
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleJson}
          className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-gradient-to-r from-sky-50 to-cyan-50 px-3.5 py-2 text-sm font-semibold text-sky-800 transition hover:border-sky-300 hover:shadow-md hover:shadow-sky-200/50"
        >
          <FileJson className="h-4 w-4 text-sky-600" aria-hidden />
          Download JSON
        </button>
        <button
          type="button"
          onClick={handleMarkdown}
          className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-gradient-to-r from-teal-50 to-emerald-50 px-3.5 py-2 text-sm font-semibold text-teal-800 transition hover:border-teal-300 hover:shadow-md hover:shadow-teal-200/50"
        >
          <FileText className="h-4 w-4 text-teal-600" aria-hidden />
          Download Markdown
        </button>
        <button
          type="button"
          onClick={handlePdf}
          disabled={pdfLoading}
          className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 px-3.5 py-2 text-sm font-semibold text-orange-900 transition hover:border-orange-300 hover:shadow-md hover:shadow-orange-200/50 disabled:opacity-60"
        >
          <Download className="h-4 w-4 text-orange-600" aria-hidden />
          {pdfLoading ? "Preparing PDF…" : "Download PDF"}
        </button>
        <button
          type="button"
          onClick={handleCopyJson}
          className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-gradient-to-r from-violet-50 to-fuchsia-50 px-3.5 py-2 text-sm font-semibold text-violet-900 transition hover:border-violet-300 hover:shadow-md hover:shadow-violet-200/50"
        >
          {copied ? (
            <Check className="h-4 w-4 text-pass" aria-hidden />
          ) : (
            <Copy className="h-4 w-4 text-violet-600" aria-hidden />
          )}
          {copied ? "Copied" : "Copy JSON"}
        </button>
      </div>
      {pdfError ? (
        <p role="alert" className="text-sm text-error">
          {pdfError}
        </p>
      ) : null}
    </div>
  );
}
