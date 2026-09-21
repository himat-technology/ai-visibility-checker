import type { Metadata } from "next";
import { Suspense } from "react";
import { AiVisibilityCheckerApp } from "@/components/ai-visibility/checker-app";

export const metadata: Metadata = {
  title: "AI Visibility Checker — Crawlability & Schema Audit",
  description:
    "Audit your website's robots.txt, AI crawler access, sitemap, llms.txt, Organization schema, and page clarity for AI search readiness.",
  openGraph: {
    title: "AI Visibility Checker — Crawlability & Schema Audit | Himat Technologies",
    description:
      "Audit your website's robots.txt, AI crawler access, sitemap, llms.txt, Organization schema, and page clarity for AI search readiness.",
    type: "website",
    url: "/free-tools/ai-visibility-checker",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Visibility Checker | Himat Technologies",
    description:
      "First-party crawlability and clarity audit for AI search readiness.",
  },
};

export default function AiVisibilityCheckerPage() {
  return (
    <main>
      <Suspense
        fallback={
          <div className="mx-auto max-w-5xl px-4 py-16 text-sm text-muted">
            Loading AI Visibility Checker…
          </div>
        }
      >
        <AiVisibilityCheckerApp />
      </Suspense>
    </main>
  );
}
