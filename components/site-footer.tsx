import { ExternalLink, Globe, Mail, Phone } from "lucide-react";
import { HIMAT } from "@/lib/site";

function IconLinkedIn({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function IconInstagram({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function IconFacebook({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 overflow-hidden rounded-2xl border border-sky-200/80 bg-gradient-to-br from-slate-900 via-sky-950 to-cyan-900 text-sky-50 shadow-xl shadow-sky-900/20">
      <div className="relative px-5 py-8 sm:px-8 sm:py-10">
        <div
          className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full bg-orange-400/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 left-10 h-44 w-44 rounded-full bg-cyan-400/20 blur-3xl"
          aria-hidden
        />

        <div className="relative grid gap-8 md:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="font-display text-2xl font-semibold tracking-tight">
              {HIMAT.name}
            </p>
            <p className="mt-2 max-w-md text-sm text-sky-100/80">
              Technical SEO, GEO, and AI-search readiness for production sites.
              First-party audits — never a citation guarantee.
            </p>
            <a
              href={HIMAT.demoTool}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-400 to-amber-300 px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-orange-500/20 transition hover:brightness-105"
            >
              Open live demo
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          </div>

          <div className="grid gap-4 text-sm sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-semibold tracking-wider text-cyan-300 uppercase">
                Contact
              </p>
              <a
                href={`mailto:${HIMAT.email}`}
                className="flex items-center gap-2 text-sky-50/90 transition hover:text-white"
              >
                <Mail className="h-4 w-4 text-cyan-300" aria-hidden />
                {HIMAT.email}
              </a>
              <a
                href={`tel:${HIMAT.phoneTel}`}
                className="flex items-center gap-2 text-sky-50/90 transition hover:text-white"
              >
                <Phone className="h-4 w-4 text-orange-300" aria-hidden />
                {HIMAT.phoneDisplay}
              </a>
              <a
                href={HIMAT.companySite}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sky-50/90 transition hover:text-white"
              >
                <Globe className="h-4 w-4 text-sky-300" aria-hidden />
                himat.co.in
              </a>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold tracking-wider text-cyan-300 uppercase">
                Social
              </p>
              <a
                href={HIMAT.social.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sky-50/90 transition hover:text-white"
              >
                <IconLinkedIn className="h-4 w-4 text-sky-300" />
                LinkedIn
              </a>
              <a
                href={HIMAT.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sky-50/90 transition hover:text-white"
              >
                <IconInstagram className="h-4 w-4 text-pink-300" />
                Instagram
              </a>
              <a
                href={HIMAT.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sky-50/90 transition hover:text-white"
              >
                <IconFacebook className="h-4 w-4 text-blue-300" />
                Facebook
              </a>
            </div>
          </div>
        </div>

        <p className="relative mt-8 border-t border-white/10 pt-4 text-xs text-sky-200/70">
          © {new Date().getFullYear()} {HIMAT.name}. Built with care in Chennai.
        </p>
      </div>
    </footer>
  );
}
