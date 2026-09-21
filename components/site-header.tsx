import Link from "next/link";
import { HIMAT } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-sky-200/70 bg-white/75 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 via-cyan-400 to-orange-400 text-sm font-bold text-white shadow-md shadow-sky-500/30"
            aria-hidden
          >
            H
          </span>
          <span className="font-display text-base font-semibold tracking-tight text-ink group-hover:text-sky-700">
            {HIMAT.shortName}
            <span className="ml-1 font-normal text-muted">Technology</span>
          </span>
        </Link>
        <nav className="flex items-center gap-3 text-sm" aria-label="Primary">
          <a
            href={HIMAT.demoTool}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden text-muted transition hover:text-sky-700 sm:inline"
          >
            Live demo
          </a>
          <a
            href={`mailto:${HIMAT.email}`}
            className="rounded-full bg-gradient-to-r from-sky-600 to-cyan-500 px-3.5 py-1.5 font-medium text-white shadow-sm shadow-sky-500/30 transition hover:brightness-110"
          >
            Contact
          </a>
        </nav>
      </div>
    </header>
  );
}
