import type { LlmsAuditResult } from "@/types/ai-visibility";

interface LlmsCheckProps {
  llms: LlmsAuditResult;
}

export function LlmsCheck({ llms }: LlmsCheckProps) {
  return (
    <div className="space-y-3 text-sm">
      <p className="rounded-lg bg-background px-3 py-2 text-muted">
        llms.txt is an <strong className="text-ink">optional</strong>{" "}
        discovery/documentation signal. This tool does not treat its absence as
        a required failure.
      </p>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-muted">Status</dt>
          <dd className="mt-0.5 font-medium text-ink">
            {llms.found ? "Found" : "Not found"}
          </dd>
        </div>
        <div>
          <dt className="text-muted">HTTP status</dt>
          <dd className="mt-0.5 font-medium text-ink">
            {llms.statusCode ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Content type</dt>
          <dd className="mt-0.5 font-medium text-ink">
            {llms.contentType ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Content length</dt>
          <dd className="mt-0.5 font-medium text-ink">
            {llms.contentLength != null ? `${llms.contentLength} chars` : "—"}
          </dd>
        </div>
      </dl>
      {llms.preview ? (
        <pre className="overflow-x-auto rounded-lg border border-border bg-background p-3 font-mono text-xs whitespace-pre-wrap text-ink">
          {llms.preview}
        </pre>
      ) : null}
      {llms.error ? <p className="text-error">{llms.error}</p> : null}
    </div>
  );
}
