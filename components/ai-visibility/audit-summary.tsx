import type { AuditReport } from "@/types/ai-visibility";

interface AuditSummaryProps {
  report: AuditReport;
}

export function AuditSummaryHeader({ report }: AuditSummaryProps) {
  return (
    <header className="animate-fade-up space-y-2">
      <p className="inline-flex rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold tracking-wide text-orange-700 uppercase">
        Report
      </p>
      <h2 className="font-display text-3xl font-extrabold tracking-tight text-ink">
        AI Visibility <span className="gradient-text">Report</span>
      </h2>
      <p className="text-sm text-muted">
        Audited URL:{" "}
        <a
          href={report.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono font-medium text-sky-700 underline-offset-2 hover:underline"
        >
          {report.url}
        </a>
      </p>
      <p className="text-sm text-muted">
        Timestamp:{" "}
        <time dateTime={report.timestamp} className="font-mono text-ink">
          {report.timestamp}
        </time>
      </p>
    </header>
  );
}
