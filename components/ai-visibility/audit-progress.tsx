"use client";

import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type AuditStepStatus = "pending" | "active" | "done" | "error";

export interface AuditStep {
  id: string;
  label: string;
  status: AuditStepStatus;
}

interface AuditProgressProps {
  steps: AuditStep[];
  complete?: boolean;
}

export function AuditProgress({ steps, complete }: AuditProgressProps) {
  return (
    <div
      className="card-glow overflow-hidden rounded-2xl border border-sky-200/80 bg-white"
      role="status"
      aria-live="polite"
      aria-busy={!complete}
    >
      <div
        className={cn(
          "h-1 w-full bg-gradient-to-r from-sky-500 via-cyan-400 to-orange-400",
          !complete && "animate-shimmer",
        )}
      />
      <div className="p-5">
        <p className="font-display text-sm font-semibold text-ink">
          {complete ? (
            <span className="text-emerald-600">Audit complete</span>
          ) : (
            <span className="bg-gradient-to-r from-sky-600 to-cyan-500 bg-clip-text text-transparent">
              Running audit…
            </span>
          )}
        </p>
        <ul className="mt-4 space-y-2.5">
          {steps.map((step) => (
            <li key={step.id} className="flex items-center gap-3 text-sm">
              <StepIcon status={step.status} />
              <span
                className={cn(
                  step.status === "pending" && "text-muted",
                  step.status === "active" && "font-semibold text-sky-700",
                  step.status === "done" && "text-ink",
                  step.status === "error" && "text-error",
                )}
              >
                {step.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function StepIcon({ status }: { status: AuditStepStatus }) {
  if (status === "done") {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-sm shadow-emerald-400/40">
        <Check className="h-3.5 w-3.5" aria-hidden />
      </span>
    );
  }
  if (status === "active") {
    return <Loader2 className="h-5 w-5 animate-spin text-sky-500" aria-hidden />;
  }
  if (status === "error") {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-error-bg text-xs font-bold text-error">
        !
      </span>
    );
  }
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-sky-200 text-muted">
      <span className="h-1.5 w-1.5 rounded-full bg-sky-200" />
    </span>
  );
}
