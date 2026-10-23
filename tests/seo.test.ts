import { describe, expect, it } from "vitest";
import { SAMPLE, findDescription, findH1, findTitle, formatReport, inspect, parseAttributes, verdict } from "@/lib/seo";

const check = (html: string, name: string) => inspect(html).checks.find((c) => c.name === name)!;

describe("inspect on the sample", () => {
  it("passes every check and scores 100", () => {
    const report = inspect(SAMPLE);
    expect(report.score).toBe(100);
    expect(report.checks.every((c) => c.ok)).toBe(true);
  });

  it("scores an empty snapshot 17 (only 'images have alt' passes with no images)", () => {
    const report = inspect("");
    expect(report.score).toBe(17);
    expect(check("", "Title present").detail).toBe("missing");
  });
});

describe("title", () => {
  it("reads a title with attributes or surrounding whitespace", () => {
    expect(findTitle('<title lang="en">\n  My page  \n</title>')).toBe("My page");
  });
});

describe("meta description", () => {
  it("keeps an apostrophe inside a double-quoted description", () => {
    expect(findDescription(`<meta name="description" content="Don't miss the launch notes for this week">`)).toBe("Don't miss the launch notes for this week");
  });

  it("measures the full description in the report, not the text up to the apostrophe", () => {
    const html = `<meta name="description" content="Don't miss the launch notes we wrote for this week's release">`;
    expect(check(html, "Meta description")).toMatchObject({ ok: true, detail: "60 chars" });
  });

  it("finds it in either attribute order and any case", () => {
    expect(findDescription('<META content="abc" NAME="Description">')).toBe("abc");
  });

  it("ignores other meta tags", () => {
    expect(findDescription('<meta name="og:description" content="x"><meta name="keywords" content="y">')).toBe("");
  });
});

describe("h1", () => {
  it("counts an h1 whose text sits in nested elements", () => {
    expect(findH1('<h1 class="hero"><span>Big</span> <em>idea</em></h1>')).toBe("Big idea");
    expect(check("<h1><span>Hi</span></h1>", "H1 present").ok).toBe(true);
  });
});

describe("image alt", () => {
  it("does not count data-alt or title as alt text", () => {
    expect(check('<img src="a.png" data-alt="x"><img src="b.png" alt="">', "Images have alt").detail).toBe("1/2");
  });

  it("passes when every image has an alt attribute (even empty, i.e. decorative)", () => {
    expect(check('<img src="a.png" alt=""><img src=b.png alt=logo>', "Images have alt").ok).toBe(true);
  });
});

describe("helpers", () => {
  it("parses quoted, unquoted and bare attributes", () => {
    expect(parseAttributes('<img src=a.png alt="x y" hidden>')).toEqual({ src: "a.png", alt: "x y", hidden: "" });
  });

  it("names the verdict bands", () => {
    expect(verdict(80)).toBe("Healthy signal");
    expect(verdict(50)).toBe("Needs attention");
    expect(verdict(49)).toBe("Incomplete signal");
  });

  it("formats a copyable report", () => {
    const text = formatReport("https://x.test", inspect(SAMPLE));
    expect(text.split("\n")[0]).toBe("https://x.test");
    expect(text).toContain("SEO snapshot score: 100/100");
    expect(text).toContain("PASS H1 present — Hello");
  });
});
