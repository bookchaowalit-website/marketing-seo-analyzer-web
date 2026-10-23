# SEO Inspection Bench

Paste an HTML snapshot and get six basic SEO checks (title, title length, meta description, h1, image alt, links) with a score. It does not fetch or crawl anything.

Live: https://seo-analyzer.bookchaowalit.com (deployed by Vercel CLI; it can lag `main`, see `PRODUCT.md`).

## What it does not do

- No crawling or fetching, no Open Graph, structured data or Core Web Vitals checks, no saved reports.

## Run

```bash
npm ci
npm run dev
```

## Checks

```bash
npm test           # Vitest: check parsing edge cases, MCP route, home page render, Sentry scrubbing
npm run lint
npm run typecheck
npm run build
```

CI (`.github/workflows/ci.yml`) runs the shared Node workflow (with a line-coverage gate) and the shared security
scan on every push and PR to `main`.

## Code map

- `lib/seo.ts`: attribute parsing, the six checks (`inspect`), the verdict bands and the copyable report text (used by the page and the MCP route).
- `app/api/mcp/route.ts`: stateless JSON-RPC endpoint with `analyze_html` and `get_sample`.
- `lib/sentry.ts` + `instrumentation*.ts`: error reporting to Sentry, errors only, personal data stripped; off when `NEXT_PUBLIC_SENTRY_DSN` is unset.
- `app/more-projects/page.tsx`: shared portfolio link page (copied per repository, not a package).
