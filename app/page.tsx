import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { HIMAT } from "@/lib/site";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto flex max-w-5xl flex-col px-4 py-16 sm:px-6 lg:px-8">
        <div className="hero-glow animate-fade-up relative overflow-hidden rounded-3xl border border-sky-200/80 bg-white/80 p-8 backdrop-blur-sm sm:p-12">
          <div
            className="pointer-events-none absolute -top-20 right-0 h-56 w-56 rounded-full bg-gradient-to-br from-sky-400/30 to-cyan-300/20 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute bottom-0 left-0 h-40 w-40 rounded-full bg-orange-400/20 blur-3xl"
            aria-hidden
          />

          <p className="relative inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold tracking-wide text-sky-700 uppercase ring-1 ring-sky-200">
            <Sparkles className="h-3.5 w-3.5 text-orange-500" aria-hidden />
            {HIMAT.name}
          </p>
          <h1 className="font-display relative mt-5 text-4xl font-extrabold tracking-tight text-ink sm:text-6xl">
            <span className="gradient-text">AI Visibility</span>
            <br />
            Checker
          </h1>
          <p className="relative mt-4 max-w-xl text-lg text-muted">
            Audit crawlability and page clarity for AI-powered search —
            robots.txt, sitemaps, Organization schema, and more.
          </p>
          <div className="relative mt-8 flex flex-wrap gap-3">
            <Link
              href="/free-tools/ai-visibility-checker"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-600 via-cyan-500 to-teal-400 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:brightness-110"
            >
              Open the checker
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <a
              href={HIMAT.demoTool}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full border border-sky-200 bg-white px-6 py-3 text-sm font-semibold text-sky-800 transition hover:bg-sky-50"
            >
              View live demo
            </a>
          </div>
        </div>
        <SiteFooter />
      </main>
    </div>
  );
}
