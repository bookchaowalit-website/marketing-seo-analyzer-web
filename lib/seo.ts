// SEO inspection bench: basic checks over a pasted HTML snapshot. Pure string parsing, no fetch, no DOM.

export type Check = { name: string; ok: boolean; detail: string };
export type Report = { checks: Check[]; score: number };

export const SAMPLE =
  '<title>Demo Page Title That Is Long Enough</title>\n<meta name="description" content="A demo description that is long enough for SEO checks.">\n<h1>Hello</h1>\n<img src="/x.png" alt="x">\n<a href="/a">A</a>';

const ATTRIBUTE = /([^\s=/>"']+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;

/** Attributes of one start tag (names lower-cased); a bare attribute gets "". */
export function parseAttributes(tag: string): Record<string, string> {
  const inner = tag.replace(/^<\s*[a-z0-9-]+/i, "").replace(/\/?>$/, "");
  const attributes: Record<string, string> = {};
  for (const match of inner.matchAll(ATTRIBUTE)) {
    attributes[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? "";
  }
  return attributes;
}

function startTags(html: string, name: string): string[] {
  return html.match(new RegExp(`<${name}\\b[^>]*>`, "gi")) ?? [];
}

function textOf(fragment: string): string {
  return fragment.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

export function findTitle(html: string): string {
  return textOf(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
}

export function findDescription(html: string): string {
  for (const tag of startTags(html, "meta")) {
    const attributes = parseAttributes(tag);
    if (attributes.name?.toLowerCase() === "description") return (attributes.content ?? "").trim();
  }
  return "";
}

/** Text of the first h1, including text inside nested elements such as <span> or <em>. */
export function findH1(html: string): string {
  return textOf(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "");
}

export function countImages(html: string): { images: number; withAlt: number } {
  const tags = startTags(html, "img");
  return { images: tags.length, withAlt: tags.filter((tag) => "alt" in parseAttributes(tag)).length };
}

export function inspect(html: string): Report {
  const title = findTitle(html);
  const description = findDescription(html);
  const h1 = findH1(html);
  const { images, withAlt } = countImages(html);
  const links = startTags(html, "a").length;
  const checks: Check[] = [
    { name: "Title present", ok: title.length > 0, detail: title || "missing" },
    { name: "Title length 30–60", ok: title.length >= 30 && title.length <= 60, detail: `${title.length} chars` },
    { name: "Meta description", ok: description.length >= 50, detail: `${description.length} chars` },
    { name: "H1 present", ok: Boolean(h1), detail: h1 || "missing" },
    { name: "Images have alt", ok: images === 0 || withAlt === images, detail: `${withAlt}/${images}` },
    { name: "Has links", ok: links > 0, detail: String(links) },
  ];
  return { checks, score: Math.round((checks.filter((check) => check.ok).length / checks.length) * 100) };
}

export function verdict(score: number): string {
  return score >= 80 ? "Healthy signal" : score >= 50 ? "Needs attention" : "Incomplete signal";
}

export function formatReport(label: string, report: Report): string {
  const lines = report.checks.map((check) => `${check.ok ? "PASS" : "FAIL"} ${check.name} — ${check.detail}`);
  return `${label}\nSEO snapshot score: ${report.score}/100\n${lines.join("\n")}`;
}
