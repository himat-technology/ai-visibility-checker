"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { AuditApiResponse, AuditReport } from "@/types/ai-visibility";
import {
  AuditProgress,
  type AuditStep,
} from "@/components/ai-visibility/audit-progress";
import { AuditSection } from "@/components/ai-visibility/audit-section";
import { AuditSummaryHeader } from "@/components/ai-visibility/audit-summary";
import { CrawlerMatrix } from "@/components/ai-visibility/crawler-matrix";
import { ExportActions } from "@/components/ai-visibility/export-actions";
import { Faq } from "@/components/ai-visibility/faq";
import { FindingsList } from "@/components/ai-visibility/finding-card";
import { LlmsCheck } from "@/components/ai-visibility/llms-check";
import { OrganizationSchema } from "@/components/ai-visibility/organization-schema";
import {
  PageClarity,
  TechnicalSignalsPanel,
} from "@/components/ai-visibility/page-clarity";
import { ScoreCard } from "@/components/ai-visibility/score-card";
import { ShareReport } from "@/components/ai-visibility/share-report";
import { SitemapCheck } from "@/components/ai-visibility/sitemap-check";
import { UrlInput } from "@/components/ai-visibility/url-input";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { HIMAT } from "@/lib/site";

const STEP_DEFS = [
  { id: "validate", label: "Validating URL" },
  { id: "page", label: "Fetching page" },
  { id: "robots", label: "Checking robots.txt" },
  { id: "sitemap", label: "Checking sitemap" },
  { id: "llms", label: "Checking llms.txt" },
  { id: "org", label: "Parsing Organization schema" },
  { id: "clarity", label: "Checking page clarity" },
  { id: "score", label: "Calculating score" },
] as const;

function initialSteps(): AuditStep[] {
  return STEP_DEFS.map((s, i) => ({
    ...s,
    status: i === 0 ? "active" : "pending",
  }));
}

export function AiVisibilityCheckerApp() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlFromQuery = searchParams.get("url") ?? "";

  const [url, setUrl] = useState(urlFromQuery);
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState<AuditStep[]>(initialSteps);
  const [complete, setComplete] = useState(false);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const autoRan = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const advanceSteps = useCallback(() => {
    clearTimers();
    setSteps(initialSteps());
    STEP_DEFS.forEach((_, index) => {
      const t = setTimeout(() => {
        setSteps((prev) =>
          prev.map((step, i) => {
            if (i < index) return { ...step, status: "done" };
            if (i === index) return { ...step, status: "active" };
            return step;
          }),
        );
      }, index * 450);
      timers.current.push(t);
    });
  }, []);

  const finishSteps = useCallback((ok: boolean) => {
    clearTimers();
    setSteps((prev) =>
      prev.map((step) => ({
        ...step,
        status: ok ? "done" : step.status === "active" ? "error" : step.status,
      })),
    );
    setComplete(ok);
  }, []);

  const runAudit = useCallback(
    async (inputUrl: string) => {
      setLoading(true);
      setError(null);
      setReport(null);
      setComplete(false);
      advanceSteps();

      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.set("url", inputUrl);
      router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false });

      try {
        const res = await fetch("/api/ai-visibility", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: inputUrl }),
        });

        const data = (await res.json()) as AuditApiResponse;

        if (!res.ok || !data.success) {
          const message =
            !data.success && "error" in data
              ? data.error
              : "Unable to complete the audit.";
          setError(message);
          finishSteps(false);
          return;
        }

        finishSteps(true);
        setReport(data.report);
      } catch {
        setError(
          "Network error while contacting the audit service. Please try again.",
        );
        finishSteps(false);
      } finally {
        setLoading(false);
      }
    },
    [advanceSteps, finishSteps, pathname, router, searchParams],
  );

  useEffect(() => {
    if (urlFromQuery && !autoRan.current) {
      autoRan.current = true;
      setUrl(urlFromQuery);
      void runAudit(urlFromQuery);
    }
    return () => clearTimers();
    // intentionally run once for query param
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="animate-fade-up mb-10 max-w-3xl">
        <p className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-100 to-orange-100 px-3 py-1 text-xs font-bold tracking-wide text-sky-800 uppercase ring-1 ring-sky-200/80">
          {HIMAT.name} · Free tool
        </p>
        <h1 className="font-display mt-4 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
          <span className="gradient-text">AI Visibility</span> Checker
        </h1>
        <p className="mt-3 text-lg text-muted">
          Audit your website&apos;s crawlability and page clarity for AI-powered
          search.
        </p>
        <p className="mt-2 text-sm text-muted">
          Check robots.txt, AI crawler access, sitemap discovery, Organization
          schema, llms.txt, and page structure.
        </p>
        <p className="mt-3 text-sm">
          <a
            href={HIMAT.demoTool}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-sky-700 underline-offset-2 hover:underline"
          >
            Live demo on himat.tech →
          </a>
        </p>
      </header>

      <div className="mb-8">
        <UrlInput
          value={url}
          onChange={setUrl}
          onSubmit={runAudit}
          loading={loading}
        />
      </div>

      {(loading || complete || error) && (
        <div className="mb-8">
          <AuditProgress steps={steps} complete={complete && !error} />
        </div>
      )}

      {error ? (
        <div
          role="alert"
          className="mb-8 rounded-xl border border-error/30 bg-error-bg p-4 text-sm text-error"
        >
          {error}
        </div>
      ) : null}

      {report ? (
        <div className="space-y-8">
          <AuditSummaryHeader report={report} />
          <ScoreCard report={report} />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <ExportActions report={report} />
          </div>
          <ShareReport url={report.url} />

          <AuditSection
            number="01"
            title="Robots & AI Crawlers"
            description="Provider-aware robots.txt matrix for major AI crawlers."
          >
            <CrawlerMatrix robots={report.robots} />
            <div className="mt-4">
              <FindingsList findings={report.findings} category="robots" />
            </div>
          </AuditSection>

          <AuditSection number="02" title="Sitemap">
            <SitemapCheck sitemap={report.sitemap} />
            <div className="mt-4">
              <FindingsList findings={report.findings} category="sitemap" />
            </div>
          </AuditSection>

          <AuditSection number="03" title="llms.txt">
            <LlmsCheck llms={report.llms} />
            <div className="mt-4">
              <FindingsList findings={report.findings} category="llms" />
            </div>
          </AuditSection>

          <AuditSection number="04" title="Organization Schema">
            <OrganizationSchema organization={report.organization} />
            <div className="mt-4">
              <FindingsList
                findings={report.findings}
                category="organization"
              />
            </div>
          </AuditSection>

          <AuditSection number="05" title="Page Clarity">
            <PageClarity pageClarity={report.pageClarity} />
            <div className="mt-4">
              <FindingsList findings={report.findings} category="pageClarity" />
            </div>
          </AuditSection>

          <AuditSection number="06" title="Technical Signals">
            <TechnicalSignalsPanel technical={report.technical} />
            <div className="mt-4">
              <FindingsList findings={report.findings} category="technical" />
            </div>
          </AuditSection>

          <section className="card-glow overflow-hidden rounded-2xl border border-orange-200/70 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-5 sm:p-6">
            <h3 className="font-display text-lg font-semibold text-ink">
              Recommendations
            </h3>
            <p className="mt-1 text-sm text-muted">
              Actionable next steps based only on detected findings.
            </p>
            {report.recommendations.length === 0 ? (
              <p className="mt-4 text-sm font-medium text-emerald-700">
                No additional recommendations — checks look solid.
              </p>
            ) : (
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-ink">
                {report.recommendations.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}

      <div className="mt-16 border-t border-sky-200/80 pt-12">
        <Faq />
      </div>

      <SiteFooter />
      </div>
    </div>
  );
}
