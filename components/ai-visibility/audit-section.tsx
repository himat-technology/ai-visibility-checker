import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AuditSectionProps {
  number: string;
  title: string;
  description?: string;
  children: ReactNode;
  accent?: string;
}

const ACCENTS: Record<string, string> = {
  "01": "from-sky-500 to-cyan-400",
  "02": "from-teal-500 to-emerald-400",
  "03": "from-cyan-500 to-blue-400",
  "04": "from-orange-500 to-amber-400",
  "05": "from-violet-500 to-fuchsia-400",
  "06": "from-rose-500 to-orange-400",
};

export function AuditSection({
  number,
  title,
  description,
  children,
  accent,
}: AuditSectionProps) {
  const bar = accent ?? ACCENTS[number] ?? "from-sky-500 to-cyan-400";

  return (
    <section className="card-glow animate-fade-up overflow-hidden rounded-2xl border border-sky-200/70 bg-white">
      <div className={cn("h-1 w-full bg-gradient-to-r", bar)} />
      <div className="p-5 sm:p-6">
        <div className="mb-4 flex items-baseline gap-3 border-b border-sky-100 pb-3">
          <span
            className={cn(
              "font-display rounded-lg bg-gradient-to-br px-2 py-0.5 text-sm font-bold text-white",
              bar,
            )}
          >
            {number}
          </span>
          <div>
            <h3 className="font-display text-lg font-semibold text-ink">
              {title}
            </h3>
            {description ? (
              <p className="mt-0.5 text-sm text-muted">{description}</p>
            ) : null}
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}
