import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

describe("home page", () => {
  it("renders the bench with the sample report and the no-crawl notice", () => {
    const html = renderToString(<Home />);
    expect(html).toContain("Find the signal in the markup.");
    expect(html).toContain("Healthy signal");
    expect(html).toContain('aria-label="100 out of 100"');
    expect(html).toContain("This tool does not fetch or crawl the URL.");
    expect(html).toContain("LOCAL SNAPSHOT / NO CRAWL");
  });
});
