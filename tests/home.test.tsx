// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Home from "@/app/page";
import { SAMPLE } from "@/lib/seo";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let host: HTMLDivElement;
const button = (text: string) => [...host.querySelectorAll("button")].find((b) => b.textContent?.trim() === text) as HTMLButtonElement;
const press = async (el: Element) => { await act(async () => { el.dispatchEvent(new MouseEvent("click", { bubbles: true })); }); };
const stats = () => [...host.querySelectorAll(".ds-stat")].map((tile) => tile.textContent);
const textarea = () => host.querySelector("textarea") as HTMLTextAreaElement;
// React listens for the native input event; set the value through the prototype setter so it notices.
function type(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value")!.set!;
  act(() => { setter.call(el, value); el.dispatchEvent(new Event("input", { bubbles: true })); });
}

beforeEach(() => {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  act(() => root.render(<Home />));
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("SEO check page", () => {
  it("opens on the sample with a full score and every check passing", () => {
    expect(host.querySelector("h1")?.textContent).toBe("On-page SEO");
    expect(stats()).toEqual(["Score100/ 100Healthy signal", "Checks passed6 / 6nothing to fix", `Snapshot${SAMPLE.length}charsupdates as you type`]);
    expect([...host.querySelectorAll(".ds-row .ds-pill")].every((pill) => pill.textContent === "Pass")).toBe(true);
    expect(host.querySelector('[role="img"]')?.getAttribute("aria-label")).toBe("100 out of 100");
    expect(host.textContent).toContain("Nothing is sent to the URL");
  });

  it("rescores as you type and names the failing checks in words", () => {
    type(textarea(), "<h1>Only a heading</h1>");
    expect(stats()[0]).toBe("Score33/ 100Incomplete signal");
    expect(stats()[1]).toBe("Checks passed2 / 64 to fix");
    const fails = [...host.querySelectorAll(".ds-row")].filter((row) => row.querySelector(".ds-pill")?.textContent === "Fail").map((row) => row.querySelector(".ds-row-name")?.textContent);
    expect(fails).toEqual(["Title present", "Title length 30–60", "Meta description", "Has links"]);
    expect(host.querySelector("#checks-heading")?.textContent).toBe("Incomplete signal");
  });

  it("copies the report with the URL label, then shows it was copied", async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    type(host.querySelector("input") as HTMLInputElement, "https://example.com");
    await press(button("Copy report"));
    expect(writeText.mock.calls[0][0]).toMatch(/^https:\/\/example\.com\nSEO snapshot score: 100\/100\nPASS Title present/);
    expect(button("Copied")).toBeTruthy();
    expect(host.querySelector('[role="status"]')?.textContent).toBe("Report copied.");
    act(() => { vi.advanceTimersByTime(1500); });
    expect(button("Copy report")).toBeTruthy();
  });

  it("says so when the clipboard refuses, and reset brings the sample back", async () => {
    Object.defineProperty(navigator, "clipboard", { value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) }, configurable: true });
    type(textarea(), "");
    await press(button("Copy report"));
    expect(host.querySelector('[role="status"]')?.textContent).toContain("Copy failed");
    await press(button("Reset sample"));
    expect(textarea().value).toBe(SAMPLE);
    expect((host.querySelector("input") as HTMLInputElement).value).toBe("https://bookchaowalit.com");
    expect(host.querySelector('[role="status"]')?.textContent).toBe("");
  });
});
