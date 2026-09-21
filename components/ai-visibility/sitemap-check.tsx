import type { SitemapAuditResult } from "@/types/ai-visibility";

interface SitemapCheckProps {
  sitemap: SitemapAuditResult;
}

export function SitemapCheck({ sitemap }: SitemapCheckProps) {
  return (
    <dl className="grid gap-3 text-sm sm:grid-cols-2">
      <Item label="Status" value={sitemap.found ? "Found" : "Not found"} />
      <Item
        label="HTTP status"
        value={sitemap.statusCode != null ? String(sitemap.statusCode) : "—"}
      />
      <Item label="Content type" value={sitemap.contentType ?? "—"} />
      <Item label="XML valid" value={sitemap.validXml ? "Yes" : "No"} />
      <Item label="Kind" value={sitemap.kind ?? "—"} />
      <Item
        label="URL count"
        value={sitemap.urlCount != null ? String(sitemap.urlCount) : "—"}
      />
      <Item
        label="Nested sitemaps"
        value={
          sitemap.nestedSitemapCount != null
            ? String(sitemap.nestedSitemapCount)
            : "—"
        }
      />
      <Item
        label="Referenced in robots.txt"
        value={
          sitemap.referencedInRobots || sitemap.robotsSitemapUrls.length > 0
            ? "Yes"
            : "No"
        }
      />
      {sitemap.robotsSitemapUrls.length > 0 ? (
        <div className="sm:col-span-2">
          <dt className="text-muted">robots.txt Sitemap URLs</dt>
          <dd className="mt-1 break-all font-mono text-xs text-ink">
            {sitemap.robotsSitemapUrls.join(", ")}
          </dd>
        </div>
      ) : null}
      {sitemap.error ? (
        <p className="sm:col-span-2 text-error">{sitemap.error}</p>
      ) : null}
      {sitemap.truncated ? (
        <p className="sm:col-span-2 text-muted">
          Count truncated for safety — large sitemaps are not fully crawled.
        </p>
      ) : null}
    </dl>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="mt-0.5 font-medium text-ink">{value}</dd>
    </div>
  );
}
