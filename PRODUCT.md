# SEO Check (dashboard) — Product truth

> Inferred from the code and copy (no user interview). Checked against the portfolio card claims review
> (`portfolio-site-web/docs/audits/CARD-CLAIMS-REVIEW-2026-10.md`, row `seo-analyzer`) on 2026-10-23.

## What it is

A client-only page that runs six basic checks on HTML you paste in: title present, title length 30–60, meta description of 50+ characters, an h1, alt on every image, at least one link. It never fetches or crawls a URL; the URL field is a label.

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

## Known limits

- Copy report state is shared between presses: a timer from an earlier successful copy can hide the manual-copy box
  of a later failed one, and a pending copy can bring that box back after Reset sample.
- A very long `<title>` or `<h1>` in the pasted HTML is shown in full in its check row, with no line clamp, so one
  row can take several phone screens (the copied report keeps the full text either way).
- The Page URL input uses the shell's 15px input size, so Safari on iPhone zooms the page when it is tapped.

## Live URL and deploy state

- Live: https://seo-analyzer.bookchaowalit.com (HTTP 200 on 2026-11-16, Dashboard shell).
- Vercel Git deploy is connected to `bookchaowalit-website/marketing-seo-analyzer-web` (owner action D9 is done): a push to `main`
  deploys. Last production deploy: 2026-11-16, Git, commit 81548b6 (Dashboard shell move), Vercel status success.
- `NEXT_PUBLIC_SENTRY_DSN` is set on the Vercel project (Sentry project `marketing-seo-analyzer-web`, org `personal-yu0`).

## Boundaries

- Browser-only apart from the stateless `/api/mcp` route, which analyses only the HTML sent to it.
- A slow earlier Copy result can briefly replace the status of a newer Copy.
