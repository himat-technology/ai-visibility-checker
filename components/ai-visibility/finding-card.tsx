import type { Finding, FindingSeverity } from "@/types/ai-visibility";
import { cn } from "@/lib/utils";

interface FindingCardProps {
  finding: Finding;
}

const severityStyles: Record<
  FindingSeverity,
  { label: string; className: string }
> = {
  pass: { label: "PASS", className: "bg-pass-bg text-pass" },
  info: { label: "INFO", className: "bg-info-bg text-info" },
  warning: { label: "WARNING", className: "bg-warn-bg text-warn" },
  error: { label: "ERROR", className: "bg-error-bg text-error" },
};

export function FindingCard({ finding }: FindingCardProps) {
  const style = severityStyles[finding.severity];
  return (
    <article className="rounded-lg border border-border bg-background p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide",
            style.className,
          )}
        >
          {style.label}
        </span>
        <h4 className="text-sm font-medium text-ink">{finding.title}</h4>
      </div>
      <p className="mt-1.5 text-sm text-muted">{finding.description}</p>
    </article>
  );
}

interface FindingsListProps {
  findings: Finding[];
  category?: string;
}

export function FindingsList({ findings, category }: FindingsListProps) {
  const filtered = category
    ? findings.filter((f) => f.category === category)
    : findings;
  if (filtered.length === 0) {
    return <p className="text-sm text-muted">No findings in this category.</p>;
  }
  return (
    <div className="grid gap-2">
      {filtered.map((f) => (
        <FindingCard key={f.id} finding={f} />
      ))}
    </div>
  );
}
