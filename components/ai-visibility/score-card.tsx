import type { AuditReport } from "@/types/ai-visibility";
import { cn } from "@/lib/utils";

interface ScoreCardProps {
  report: AuditReport;
}

const STAT_STYLES = {
  Passed: "from-emerald-50 to-teal-50 border-emerald-200 text-emerald-800",
  Warnings: "from-amber-50 to-orange-50 border-amber-200 text-amber-900",
  Errors: "from-rose-50 to-red-50 border-rose-200 text-rose-800",
  Info: "from-sky-50 to-blue-50 border-sky-200 text-sky-800",
} as const;

const BAR_COLORS = [
  "from-sky-500 to-cyan-400",
  "from-cyan-500 to-teal-400",
  "from-teal-500 to-emerald-400",
  "from-orange-500 to-amber-400",
  "from-blue-500 to-indigo-400",
  "from-fuchsia-500 to-pink-400",
];

export function ScoreCard({ report }: ScoreCardProps) {
  const tone =
    report.score >= 80
      ? "from-emerald-500 via-teal-400 to-cyan-400"
      : report.score >= 50
        ? "from-amber-500 via-orange-400 to-rose-400"
        : "from-rose-500 via-orange-500 to-amber-400";

  return (
    <div className="card-glow animate-score-pop overflow-hidden rounded-2xl border border-sky-200/80 bg-white">
      <div className={cn("h-1.5 w-full bg-gradient-to-r animate-shimmer", tone)} />
      <div className="p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-wide text-sky-600 uppercase">
              Overall score
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className={cn(
                  "font-display bg-gradient-to-br bg-clip-text text-7xl font-extrabold tracking-tight text-transparent tabular-nums",
                  tone,
                )}
              >
                {report.score}
              </span>
              <span className="text-2xl font-medium text-sky-400">/ 100</span>
            </div>
            <p className="mt-2 text-base font-semibold text-ink">
              {report.scoreLabel}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <Stat label="Passed" value={report.summary.passed} />
            <Stat label="Warnings" value={report.summary.warnings} />
            <Stat label="Errors" value={report.summary.errors} />
            <Stat label="Info" value={report.summary.informational} />
          </div>
        </div>
        <p className="mt-6 max-w-3xl border-t border-sky-100 pt-4 text-sm text-muted">
          {report.scoreDisclaimer}
        </p>
        <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(
            [
              ["Robots / crawlers", report.breakdown.robots, report.breakdown.max.robots],
              ["Sitemap", report.breakdown.sitemap, report.breakdown.max.sitemap],
              ["llms.txt", report.breakdown.llms, report.breakdown.max.llms],
              [
                "Organization",
                report.breakdown.organization,
                report.breakdown.max.organization,
              ],
              [
                "Page clarity",
                report.breakdown.pageClarity,
                report.breakdown.max.pageClarity,
              ],
              ["Technical", report.breakdown.technical, report.breakdown.max.technical],
            ] as const
          ).map(([label, value, max], i) => (
            <BreakdownRow
              key={label}
              label={label}
              value={value}
              max={max}
              barClass={BAR_COLORS[i % BAR_COLORS.length]}
            />
          ))}
        </dl>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
}: {
  label: keyof typeof STAT_STYLES;
  value: number;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-gradient-to-br px-3 py-2.5",
        STAT_STYLES[label],
      )}
    >
      <p className="text-xs font-medium opacity-80">{label}</p>
      <p className="text-lg font-bold tabular-nums">{value}</p>
    </div>
  );
}

function BreakdownRow({
  label,
  value,
  max,
  barClass,
}: {
  label: string;
  value: number;
  max: number;
  barClass: string;
}) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="rounded-xl bg-sky-50/50 p-3 ring-1 ring-sky-100">
      <div className="mb-1.5 flex justify-between text-xs">
        <dt className="font-medium text-muted">{label}</dt>
        <dd className="font-bold tabular-nums text-ink">
          {value}/{max}
        </dd>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white">
        <div
          className={cn("h-full rounded-full bg-gradient-to-r", barClass)}
          style={{ width: `${pct}%` }}
          role="presentation"
        />
      </div>
    </div>
  );
}
