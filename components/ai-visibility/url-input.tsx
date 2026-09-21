"use client";

import { FormEvent, useState } from "react";
import { Search, Zap } from "lucide-react";

interface UrlInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (url: string) => void;
  loading?: boolean;
  disabled?: boolean;
}

export function UrlInput({
  value,
  onChange,
  onSubmit,
  loading,
  disabled,
}: UrlInputProps) {
  const [localError, setLocalError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      setLocalError("Enter a website URL to audit.");
      return;
    }
    setLocalError(null);
    onSubmit(trimmed);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="hero-glow w-full rounded-2xl border border-sky-200/80 bg-white/90 p-4 backdrop-blur-sm sm:p-5"
      noValidate
    >
      <label htmlFor="audit-url" className="sr-only">
        Website URL
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-sky-500"
            aria-hidden
          />
          <input
            id="audit-url"
            name="url"
            type="url"
            inputMode="url"
            autoComplete="url"
            placeholder="https://example.com"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              if (localError) setLocalError(null);
            }}
            disabled={disabled || loading}
            className="w-full rounded-xl border border-sky-200 bg-sky-50/40 py-3.5 pr-4 pl-11 text-base text-ink shadow-inner placeholder:text-sky-400/80 focus:border-sky-400 focus:bg-white disabled:opacity-60"
            aria-invalid={Boolean(localError)}
            aria-describedby={localError ? "url-error" : "url-hint"}
          />
        </div>
        <button
          type="submit"
          disabled={disabled || loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 via-cyan-500 to-teal-400 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-sky-500/35 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Zap className="h-4 w-4" aria-hidden />
          {loading ? "Checking…" : "Check AI Visibility"}
        </button>
      </div>
      <p id="url-hint" className="mt-3 text-sm text-muted">
        First-party technical checks only — not a prediction of AI citations.
      </p>
      {localError ? (
        <p id="url-error" role="alert" className="mt-2 text-sm text-error">
          {localError}
        </p>
      ) : null}
    </form>
  );
}
