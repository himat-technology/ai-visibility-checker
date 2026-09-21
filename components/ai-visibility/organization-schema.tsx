import type { OrganizationAuditResult } from "@/types/ai-visibility";

interface OrganizationSchemaProps {
  organization: OrganizationAuditResult;
}

export function OrganizationSchema({ organization }: OrganizationSchemaProps) {
  const statusLabel =
    organization.status === "found"
      ? "Found"
      : organization.status === "invalid"
        ? "Invalid"
        : "Missing";

  return (
    <div className="space-y-4 text-sm">
      <p>
        Status:{" "}
        <span className="font-semibold text-ink">{statusLabel}</span>
      </p>

      {organization.fields ? (
        <dl className="grid gap-3 sm:grid-cols-2">
          <Field label="Type" value={organization.fields.type} />
          <Field label="Organization" value={organization.fields.name} />
          <Field label="URL" value={organization.fields.url} />
          <Field
            label="Logo"
            value={organization.fields.logo ? "Detected" : "Not detected"}
          />
          <Field
            label="sameAs"
            value={
              organization.fields.sameAs.length
                ? `Detected (${organization.fields.sameAs.length})`
                : "Not detected"
            }
          />
          <Field label="Telephone" value={organization.fields.telephone} />
          <Field label="Address" value={organization.fields.address} />
          <Field label="Description" value={organization.fields.description} />
        </dl>
      ) : (
        <p className="text-muted">
          No Organization (or related) JSON-LD entity was detected on the page.
        </p>
      )}

      {organization.parseErrors.length > 0 ? (
        <p className="text-warn">{organization.parseErrors.join(" ")}</p>
      ) : null}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="mt-0.5 font-medium break-words text-ink">
        {value ?? "—"}
      </dd>
    </div>
  );
}
