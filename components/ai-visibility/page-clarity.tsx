import type { PageClarityResult, TechnicalSignals } from "@/types/ai-visibility";

interface PageClarityProps {
  pageClarity: PageClarityResult;
}

export function PageClarity({ pageClarity }: PageClarityProps) {
  return (
    <dl className="grid gap-3 text-sm sm:grid-cols-2">
      <Field
        label="Title"
        value={
          pageClarity.title.value
            ? `${pageClarity.title.value} (${pageClarity.title.length} chars)`
            : "Missing"
        }
      />
      <Field
        label="Meta description"
        value={
          pageClarity.metaDescription.value
            ? `${pageClarity.metaDescription.value.slice(0, 160)}${pageClarity.metaDescription.length > 160 ? "…" : ""} (${pageClarity.metaDescription.length} chars)`
            : "Missing"
        }
      />
      <Field
        label="Canonical"
        value={
          pageClarity.canonical.value
            ? `${pageClarity.canonical.value} (${pageClarity.canonical.status})`
            : "Missing"
        }
      />
      <Field
        label="H1"
        value={
          pageClarity.h1.status === "none"
            ? "0 H1"
            : pageClarity.h1.status === "single"
              ? `1 H1 — ${pageClarity.h1.texts[0] ?? ""}`
              : `${pageClarity.h1.count} H1s (HTML5 allows multiple contextual headings)`
        }
      />
      <Field
        label="HTML language"
        value={pageClarity.lang.value ?? "Missing"}
      />
      <Field
        label="Viewport"
        value={pageClarity.viewport.present ? "Present" : "Missing"}
      />
      <Field
        label="Robots meta"
        value={
          pageClarity.robotsMeta.value
            ? `${pageClarity.robotsMeta.value}${pageClarity.robotsMeta.noindex ? " (noindex)" : ""}`
            : "None (default index/follow)"
        }
      />
      <Field
        label="Open Graph"
        value={
          [
            pageClarity.openGraph.title && "og:title",
            pageClarity.openGraph.description && "og:description",
            pageClarity.openGraph.url && "og:url",
            pageClarity.openGraph.image && "og:image",
          ]
            .filter(Boolean)
            .join(", ") || "Not detected (informational)"
        }
      />
    </dl>
  );
}

interface TechnicalSignalsProps {
  technical: TechnicalSignals;
}

export function TechnicalSignalsPanel({ technical }: TechnicalSignalsProps) {
  return (
    <dl className="grid gap-3 text-sm sm:grid-cols-2">
      <Field label="HTTPS" value={technical.https ? "Yes" : "No"} />
      <Field label="HTTP status" value={String(technical.statusCode ?? "—")} />
      <Field label="Final URL" value={technical.finalUrl} />
      <Field
        label="Redirected"
        value={technical.redirected ? "Yes" : "No"}
      />
      <Field
        label="Response time"
        value={
          technical.responseTimeMs != null
            ? `${technical.responseTimeMs} ms`
            : "—"
        }
      />
      <Field label="Content type" value={technical.contentType ?? "—"} />
      <Field
        label="HTML size"
        value={
          technical.htmlSizeBytes != null
            ? `${technical.htmlSizeBytes.toLocaleString()} bytes`
            : "—"
        }
      />
      <Field label="X-Robots-Tag" value={technical.xRobotsTag ?? "None"} />
      <Field
        label="Structured data"
        value={technical.hasStructuredData ? "JSON-LD present" : "None detected"}
      />
      {technical.error ? (
        <p className="sm:col-span-2 text-error">{technical.error}</p>
      ) : null}
    </dl>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="mt-0.5 font-medium break-words text-ink">{value}</dd>
    </div>
  );
}
