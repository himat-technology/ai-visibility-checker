import type { RobotsAuditResult } from "@/types/ai-visibility";
import { cn } from "@/lib/utils";

interface CrawlerMatrixProps {
  robots: RobotsAuditResult;
}

export function CrawlerMatrix({ robots }: CrawlerMatrixProps) {
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted">
        <p>
          robots.txt:{" "}
          <span className="font-medium text-ink">
            {robots.found ? "Found" : "Not found"}
          </span>
          {robots.statusCode != null ? ` · HTTP ${robots.statusCode}` : ""}
        </p>
        {robots.error ? <p className="mt-1 text-error">{robots.error}</p> : null}
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[32rem] text-left text-sm">
          <caption className="sr-only">AI crawler access matrix from robots.txt</caption>
          <thead className="bg-background text-xs tracking-wide text-muted uppercase">
            <tr>
              <th scope="col" className="px-3 py-2.5 font-medium">
                Bot
              </th>
              <th scope="col" className="px-3 py-2.5 font-medium">
                Status
              </th>
              <th scope="col" className="px-3 py-2.5 font-medium">
                Details
              </th>
            </tr>
          </thead>
          <tbody>
            {robots.crawlers.map((c) => (
              <tr key={c.name} className="border-t border-border">
                <th scope="row" className="px-3 py-2.5 font-medium text-ink">
                  <div>{c.name}</div>
                  <div className="mt-0.5 text-xs font-normal text-muted">
                    {c.purpose}
                  </div>
                </th>
                <td className="px-3 py-2.5">
                  <StatusBadge status={c.status} />
                </td>
                <td className="px-3 py-2.5 text-muted">{c.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="rounded-lg bg-accent-soft p-3 text-sm text-ink">
        <strong className="font-semibold">OAI-SearchBot vs GPTBot:</strong>{" "}
        OAI-SearchBot is used for ChatGPT Search discovery. GPTBot relates to
        training use cases. They are different agents with different policies —
        blocking one does not imply the other is blocked.
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    allowed: "bg-pass-bg text-pass",
    blocked: "bg-error-bg text-error",
    not_specified: "bg-warn-bg text-warn",
    unknown: "bg-info-bg text-info",
  };
  const label: Record<string, string> = {
    allowed: "Allowed",
    blocked: "Blocked",
    not_specified: "Not specified",
    unknown: "Unknown",
  };
  return (
    <span
      className={cn(
        "inline-flex rounded px-2 py-0.5 text-xs font-semibold",
        map[status] ?? "bg-background text-muted",
      )}
    >
      {label[status] ?? status}
    </span>
  );
}
