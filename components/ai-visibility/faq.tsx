const FAQS = [
  {
    q: "Does this tool make ChatGPT recommend my website?",
    a: "No. It checks technical crawlability and page clarity signals. AI citation and recommendation decisions depend on many additional factors such as authority, relevance, and model behavior.",
  },
  {
    q: "Is llms.txt required?",
    a: "No. The checker looks for /llms.txt as an optional discovery and documentation signal. Its absence is informational and does not guarantee a failed audit.",
  },
  {
    q: "Is my URL permanently stored?",
    a: "No. The server fetches your URL to run the audit and returns a report. Shareable links use a ?url= query parameter in the browser. There is no public gallery or permanent audit database in this version.",
  },
  {
    q: "Why check OAI-SearchBot separately from GPTBot?",
    a: "OAI-SearchBot is used for ChatGPT Search discovery. GPTBot relates to training use cases. They are different user-agents with different policies, so this tool evaluates them separately.",
  },
  {
    q: "Can I download my report?",
    a: "Yes. After a check completes you can download findings as JSON, Markdown (.md), or PDF. Exports are generated from the current in-browser results.",
  },
];

export function Faq() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <section className="space-y-4" aria-labelledby="faq-heading">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h2
        id="faq-heading"
        className="font-display text-2xl font-bold tracking-tight text-ink"
      >
        <span className="gradient-text">FAQ</span>
      </h2>
      <div className="space-y-3">
        {FAQS.map((item, i) => (
          <details
            key={item.q}
            className="group card-glow rounded-2xl border border-sky-200/70 bg-white p-4 open:ring-2 open:ring-sky-200"
          >
            <summary className="cursor-pointer list-none text-sm font-semibold text-ink marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="flex items-center justify-between gap-3">
                <span className="flex items-start gap-2">
                  <span className="mt-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-gradient-to-br from-sky-500 to-cyan-400 text-[10px] font-bold text-white">
                    {i + 1}
                  </span>
                  {item.q}
                </span>
                <span className="text-sky-500 transition group-open:rotate-45 group-open:text-orange-500">
                  +
                </span>
              </span>
            </summary>
            <p className="mt-3 pl-7 text-sm text-muted">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
