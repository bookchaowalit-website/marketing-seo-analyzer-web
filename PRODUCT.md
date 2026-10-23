# SEO Inspection Bench — Product truth

> Inferred from the code and copy (no user interview). Checked against the portfolio card claims review
> (`portfolio-site-web/docs/audits/CARD-CLAIMS-REVIEW-2026-10.md`, row `seo-analyzer`) on 2026-10-23.

## What it is

A client-only bench that runs six basic checks on HTML you paste in: title present, title length 30–60, meta description of 50+ characters, an h1, alt on every image, at least one link. It never fetches or crawls a URL; the URL field is a label.

## Who it is for

A portfolio visitor who wants a quick sanity check of a page snapshot.

## What works today

1. Paste HTML; the score (share of passed checks) and each check update as you type.
2. Attributes are read in any order and quote style (an apostrophe inside a double-quoted description is kept), an h1 counts even when its text is inside nested elements, and only a real `alt` attribute counts as alt text.
3. Copy the report as text, or reset the sample.
4. `/api/mcp` answers JSON-RPC with `analyze_html` (the same checks on HTML in the request, up to 200,000 characters) and `get_sample`; there is no crawl tool, and unknown tools and methods get JSON-RPC errors.
5. Front-end and server errors go to Sentry (errors only, personal data stripped) when `NEXT_PUBLIC_SENTRY_DSN` is set.

## What does not work (and must not be claimed)

- No fetching of any URL, no 20+ criteria, Open Graph, structured data or Core Web Vitals, and no portfolio-wide automated audits (removed from the portfolio card in the 2026-10 review).
- The checks are regex-level string parsing of a snapshot, not a browser DOM: script-built content is invisible to them.
- No ranking prediction, history or saved reports.

## Live URL and deploy state

- Live: https://seo-analyzer.bookchaowalit.com (HTTP 200 on 2026-10-23).
- The Vercel project `bookchaowalit-seo-analyzer-frontend` is deployed only by CLI. Its last production deploy is the CVE patch (2026-10-23, CLI, commit 5ea4d18). Its Git link names the old repository `bookchaowalit/bookchaowalit-seo-analyzer-frontend`, so a push to `main` does not deploy: the L2 work stays undeployed until the owner reconnects Vercel Git to this repository (owner action D9). `NEXT_PUBLIC_SENTRY_DSN` is already set on the Vercel project (Sentry project `marketing-seo-analyzer-web`, org `personal-yu0`).

## Boundaries

- Browser-only apart from the stateless `/api/mcp` route, which analyses only the HTML sent to it.
