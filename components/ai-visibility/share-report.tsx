"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";

interface ShareReportProps {
  url: string;
}

export function ShareReport({ url }: ShareReportProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/free-tools/ai-visibility-checker?url=${encodeURIComponent(url)}`
      : "";

  async function handleCopy() {
    const href =
      shareUrl ||
      `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/free-tools/ai-visibility-checker?url=${encodeURIComponent(url)}`;
    await navigator.clipboard.writeText(href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="card-glow overflow-hidden rounded-2xl border border-cyan-200/80 bg-gradient-to-br from-cyan-50 via-white to-sky-50 p-4">
      <p className="font-display text-sm font-semibold text-sky-900">
        Shareable report URL
      </p>
      <p className="mt-1 text-sm text-muted">
        Results are not stored in a database. Sharing uses a{" "}
        <code className="rounded bg-sky-100 px-1 font-mono text-xs text-sky-800">
          ?url=
        </code>{" "}
        query parameter.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          readOnly
          value={
            typeof window !== "undefined"
              ? `${window.location.origin}/free-tools/ai-visibility-checker?url=${encodeURIComponent(url)}`
              : `/free-tools/ai-visibility-checker?url=${encodeURIComponent(url)}`
          }
          className="flex-1 rounded-xl border border-sky-200 bg-white px-3 py-2.5 font-mono text-xs text-ink"
          aria-label="Shareable report URL"
        />
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-500/30 transition hover:brightness-110"
        >
          {copied ? (
            <Check className="h-4 w-4" aria-hidden />
          ) : (
            <Link2 className="h-4 w-4" aria-hidden />
          )}
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
    </div>
  );
}
