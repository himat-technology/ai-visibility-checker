# AI Visibility Checker

Technical SEO / GEO auditing tool by **[Himat Technologies](https://himat.tech)**. Enter a public website URL and receive a first-party **AI Visibility / AI Search Readiness** report covering robots.txt, AI crawler access, sitemaps, `llms.txt`, Organization JSON-LD, page clarity, and technical signals.

> **Important:** The score is a **technical readiness** summary of first-party checks. It is **not** a prediction of AI citations, ChatGPT recommendations, or search rankings.

---

## Live demo

**Try it online:** [https://himat.tech/free-tools/ai-visibility-checker](https://himat.tech/free-tools/ai-visibility-checker)

**Run locally:** [http://localhost:3000/free-tools/ai-visibility-checker](http://localhost:3000/free-tools/ai-visibility-checker)

---

## Contact & social

| | |
|---|---|
| **Company** | [Himat Technologies](https://himat.tech) |
| **Website** | [himat.co.in](https://himat.co.in) |
| **Email** | [info@himat.co.in](mailto:info@himat.co.in) |
| **Phone** | [+91 94452 34023](tel:+919445234023) |
| **LinkedIn** | [himat-technology](https://www.linkedin.com/company/himat-technology) |
| **Instagram** | [@himat_technology](https://www.instagram.com/himat_technology) |
| **Facebook** | [Himat Technology](https://www.facebook.com/people/Himat-technology/61593829197445/) |

---

## Features

- Robots.txt parsing with a matrix for **OAI-SearchBot**, **OAI-AdsBot**, **GPTBot**, **ClaudeBot**, and **Google-Extended**
- Sitemap discovery (`/sitemap.xml` + robots.txt `Sitemap:` directives)
- Optional `/llms.txt` discovery (never treated as mandatory)
- Organization JSON-LD detection (`Organization`, `Corporation`, `LocalBusiness`, etc.)
- Page clarity: title, meta description, canonical, H1, `lang`, viewport, robots meta, Open Graph
- Transparent scoring with PASS / INFO / WARNING / ERROR findings
- Actionable recommendations derived only from detected issues
- Shareable report URLs via `?url=`
- Export as **JSON**, **Markdown**, and **PDF**
- SSRF-hardened server-side fetching (no database required)

---

## Architecture

```
app/
  page.tsx                          # Landing
  free-tools/ai-visibility-checker/ # Tool UI + metadata
  api/ai-visibility/                # POST audit API
  api/ai-visibility/pdf/            # PDF generation

components/ai-visibility/           # UI sections & exports
components/site-header.tsx          # Brand header
components/site-footer.tsx          # Contact + social footer

lib/ai-visibility/                  # Audit engine
lib/site.ts                         # Himat contact & social links

utils/                              # URL helpers, markdown, PDF
types/ai-visibility.ts              # Shared TypeScript types
tests/ai-visibility/                # Unit tests (Vitest)
```

Audits are computed dynamically from the requested URL. Nothing is persisted to a database.

---

## Installation

```bash
npm install
cp .env.example .env.local
```

---

## Environment variables

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Public origin for metadata / share links | `http://localhost:3000` |
| `AUDIT_USER_AGENT` | Optional outbound User-Agent override | Himat checker UA |

No API keys are required for core auditing.

---

## Local development

```bash
npm run dev
```

- App: http://localhost:3000  
- Tool: http://localhost:3000/free-tools/ai-visibility-checker  
- Shareable: http://localhost:3000/free-tools/ai-visibility-checker?url=https%3A%2F%2Fexample.com  
- Live demo: https://himat.tech/free-tools/ai-visibility-checker

---

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run test` | Vitest unit tests |
| `npm run format` | Prettier |

---

## API

### `POST /api/ai-visibility`

Request:

```json
{ "url": "https://example.com" }
```

Success:

```json
{
  "success": true,
  "report": {
    "url": "https://example.com/",
    "timestamp": "...",
    "score": 82,
    "scoreLabel": "Technical readiness",
    "robots": {},
    "sitemap": {},
    "llms": {},
    "organization": {},
    "pageClarity": {},
    "technical": {},
    "findings": [],
    "recommendations": []
  }
}
```

### `POST /api/ai-visibility/pdf`

Accepts `{ "report": <AuditReport> }` and returns a PDF download.

---

## Scoring methodology (100 points)

| Area | Max |
|---|---|
| Robots / crawler accessibility | 25 |
| Sitemap | 15 |
| llms.txt (optional bonus) | 5 |
| Organization schema | 20 |
| Page clarity | 25 |
| Technical accessibility | 10 |

Each point maps to an individual finding. Absence of `llms.txt` scores 0 in that bucket and is labeled **INFO**, not ERROR.

---

## Security / SSRF protection

Outbound fetches:

- Allow only `http` / `https`
- Block localhost, private IPv4/IPv6, link-local, metadata hosts
- Resolve DNS and re-check resolved addresses
- Enforce timeouts, max response size, redirect limits
- Use a dedicated audit User-Agent
- Never expose stack traces to clients

Do not deploy this as an open proxy without additional rate limiting and abuse controls.

---

## Testing

```bash
npm run test
```

Coverage includes robots parsing, sitemap XML, JSON-LD Organization extraction, page clarity, scoring, and URL/SSRF helpers.

---

## Production build

```bash
npm run build
npm run start
```

---

## Limitations

- Does not crawl entire sites or follow unlimited nested sitemaps
- Does not query AI providers or estimate citation probability
- JavaScript-rendered-only content may be incomplete (fetches raw HTML)
- robots.txt semantics are approximated for site-root evaluation
- Some hosts may block datacenter IPs (403/429)

---

## License

MIT — see [LICENSE](./LICENSE).

Built by [Himat Technologies](https://himat.tech) · [himat.co.in](https://himat.co.in) · [info@himat.co.in](mailto:info@himat.co.in) · [+91 94452 34023](tel:+919445234023)
