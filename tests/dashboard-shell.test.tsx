// @vitest-environment happy-dom
import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ChartPanel, DashFoot, DashTop, Pill, Segmented, Stat, axisSteps, chartTop, linePoints } from "@/components/dashboard-shell";

// Tests for the copied-in Dashboard shell itself, so every app that copies it covers all of it.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let host: HTMLDivElement;
const render = (node: React.ReactNode) => act(() => root.render(node));
const button = (text: string) => [...host.querySelectorAll("button")].find((b) => b.textContent?.trim() === text) as HTMLButtonElement;
const press = (el: Element) => act(() => { el.dispatchEvent(new MouseEvent("click", { bubbles: true })); });

beforeEach(() => {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

function Switch() {
  const [value, setValue] = useState<"a" | "b">("a");
  return <><Segmented label="Period" options={[{ id: "a", label: "A" }, { id: "b", label: "B" }]} value={value} onChange={setValue} /><output>{value}</output></>;
}

describe("dashboard shell", () => {
  it("renders the top bar, footer, pill and stat tile", () => {
    render(<><DashTop name="Name" tagline="Tagline" /><Pill tone="green">Up</Pill><ul><Stat label="Peak" value={9} unit="kWh" note="at 13:00" /><Stat label="Plain" value="x" /></ul><DashFoot source="https://example.com/repo" /></>);
    expect(host.querySelector(".ds-brand")?.textContent).toBe("NameTagline");
    expect(host.querySelector(".ds-pill")?.getAttribute("data-tone")).toBe("green");
    expect([...host.querySelectorAll(".ds-stat")].map((tile) => tile.textContent)).toEqual(["Peak9kWhat 13:00", "Plainx"]);
    expect([...host.querySelectorAll(".ds-foot a")].map((a) => a.getAttribute("href"))).toContain("https://example.com/repo");
  });

  it("marks the pressed segment and reports the change", () => {
    render(<Switch />);
    expect(host.querySelector('[role="group"]')?.getAttribute("aria-label")).toBe("Period");
    press(button("B"));
    expect(button("B").getAttribute("aria-pressed")).toBe("true");
    expect(button("A").getAttribute("aria-pressed")).toBe("false");
    expect(host.querySelector("output")?.textContent).toBe("b");
  });

  it("draws the chart, puts ticks on the data scale and switches to a table with the peak named", () => {
    render(<ChartPanel title="Load" subtitle="Today" summary="Peak 3" values={[1, 3, 2]} labels={["00", "01", "02"]} ticks={[0, 1, 2]} max={4} unit="kWh" labelHeading="Hour" />);
    expect(host.querySelector("svg")?.getAttribute("aria-label")).toBe("Peak 3");
    expect([...host.querySelectorAll(".ds-chart-y span")].map((span) => span.textContent)).toEqual(["0", "1", "2", "3", "4"]);
    render(<ChartPanel title="Odd" summary="s" values={[1]} labels={["a"]} ticks={[0]} max={3} unit="%" labelHeading="x" />);
    expect([...host.querySelectorAll(".ds-chart-y span")].map((span) => span.textContent)).toEqual(["0", "0.75", "1.5", "2.25", "3"]);
    render(<ChartPanel title="Load" subtitle="Today" summary="Peak 3" values={[1, 3, 2]} labels={["00", "01", "02"]} ticks={[0, 1, 2]} max={4} unit="kWh" labelHeading="Hour" />);
    const ticks = [...host.querySelectorAll<HTMLElement>(".ds-chart-x span")];
    expect(ticks.map((span) => [span.textContent, span.style.left, span.dataset.edge ?? ""])).toEqual([["00", "0%", "start"], ["01", "50%", ""], ["02", "100%", "end"]]);
    expect(host.querySelector(".ds-chart-peak")?.getAttribute("x1")).toBe("500");
    const details = host.querySelector<HTMLDetailsElement>("details.ds-chart-switch") as HTMLDetailsElement;
    const summary = details.querySelector("summary") as HTMLElement;
    expect(details.open).toBe(false);
    press(summary);
    expect(details.open).toBe(true);
    // A disclosure, not a pressed button: the name stays "Show table" and the browser announces open or closed.
    expect(summary.textContent).toBe("Show table");
    expect(host.querySelector("[aria-pressed]")).toBeNull();
    expect([...details.querySelectorAll("tbody tr")].map((row) => row.textContent)).toEqual(["001", "013 (peak)", "022"]);
    expect(details.querySelector('[role="region"]')?.getAttribute("aria-label")).toBe("Load as a table");
    press(summary);
    expect(details.open).toBe(false);
    expect(host.querySelector("svg")).not.toBeNull();
  });

  it("puts the table in the server HTML, so it opens without JavaScript", () => {
    const html = renderToStaticMarkup(<ChartPanel title="Load" summary="s" values={[1, 3]} labels={["00", "01"]} ticks={[0, 1]} max={4} unit="kWh" labelHeading="Hour" />);
    expect(html).toMatch(/<details class="ds-chart-switch"><summary class="ds-plain">Show table<\/summary>.*<table class="ds-table">.*<\/details><div class="ds-chart">/);
    expect(html).toContain("<td>3 (peak)</td>");
  });

  it("draws a label once when two ticks point at the same value", () => {
    render(<ChartPanel title="One" summary="s" values={[5]} labels={["a to b"]} ticks={[0, 0]} tickLabels={["−7d", "now"]} max={5} unit="clicks" labelHeading="Interval" />);
    expect([...host.querySelectorAll(".ds-chart-x span")].map((span) => span.textContent)).toEqual(["−7d"]);
  });

  it("uses short tick text when given and draws no peak for an empty series", () => {
    render(<ChartPanel title="Clicks" summary="s" values={[]} labels={[]} ticks={[]} max={0} unit="%" labelHeading="Interval" />);
    expect(host.querySelector(".ds-chart-peak")).toBeNull();
    render(<ChartPanel title="Clicks" summary="s" values={[1, 2, 3]} labels={["a to b", "b to c", "c to d"]} ticks={[0, 2]} tickLabels={["−3h", "now"]} max={3} unit="%" labelHeading="Interval" />);
    expect([...host.querySelectorAll(".ds-chart-x span")].map((span) => span.textContent)).toEqual(["−3h", "now"]);
  });

  it("draws one value as a dot, with no line or area sloping to the right edge", () => {
    render(<ChartPanel title="Odd" summary="s" values={[1]} labels={["a"]} ticks={[0]} max={4} unit="%" labelHeading="x" />);
    expect(host.querySelector(".ds-chart-area")).toBeNull();
    expect(host.querySelector(".ds-chart-line")).toBeNull();
    const dot = host.querySelector(".ds-chart-dot");
    expect([dot?.getAttribute("x1"), dot?.getAttribute("y1"), dot?.getAttribute("y2")]).toEqual(["0", "75", "75"]);
    render(<ChartPanel title="Two" summary="s" values={[1, 2]} labels={["a", "b"]} ticks={[0, 1]} max={4} unit="%" labelHeading="x" />);
    expect(host.querySelector(".ds-chart-dot")).toBeNull();
    expect(host.querySelector(".ds-chart-area")?.getAttribute("points")).toBe("0,100 0,75 1000,50 1000,100");
  });

  it("labels the y axis on the same top as the line, with enough decimals for small scales", () => {
    expect(axisSteps(0)).toEqual([0, 0.25, 0.5, 0.75, 1]);
    expect(axisSteps(0.002)).toEqual([0, 0.0005, 0.001, 0.0015, 0.002]);
    expect(axisSteps(0.02)).toEqual([0, 0.005, 0.01, 0.015, 0.02]);
    expect(axisSteps(1000)).toEqual([0, 250, 500, 750, 1000]);
    expect(axisSteps(100)).toEqual([0, 25, 50, 75, 100]);
    expect(chartTop(100)).toBe(100);
    render(<ChartPanel title="Zero" summary="s" values={[0, 0]} labels={["a", "b"]} ticks={[0, 1]} max={0} unit="%" labelHeading="x" />);
    expect([...host.querySelectorAll(".ds-chart-y span")].map((span) => span.textContent)).toEqual(["0", "0.25", "0.5", "0.75", "1"]);
  });

  it("keeps only the current rows in the table when labels repeat", () => {
    const chart = (values: number[], labels: string[]) => <ChartPanel title="Load" summary="s" values={values} labels={labels} ticks={[0]} max={4} unit="kWh" labelHeading="Hour" />;
    render(chart([1, 2, 3], ["08:00", "08:00", "09:00"]));
    expect(host.querySelectorAll("tbody tr")).toHaveLength(3);
    render(chart([3, 1], ["09:00", "08:00"]));
    expect([...host.querySelectorAll("tbody tr")].map((row) => row.textContent)).toEqual(["09:003 (peak)", "08:001"]);
  });

  it("rounds the top up to round grid gaps and draws the line on that same top", () => {
    // max 50 has 12.5 gaps; labelled 13 / 38 they would lie, so the scale grows to 52 and every label is exact.
    expect(axisSteps(50)).toEqual([0, 13, 26, 39, 52]);
    expect(axisSteps(100.25)).toEqual([0, 26, 52, 78, 104]);
    expect(chartTop(50.5)).toBe(52);
    expect(linePoints([26, 52], 50)).toBe("0,50 1000,0");
    render(<ChartPanel title="Odd" summary="s" values={[100.25]} labels={["a"]} ticks={[0]} max={100.25} unit="%" labelHeading="x" />);
    expect(host.querySelector(".ds-chart-y span:last-child")?.textContent).toBe("104");
    expect(Number(host.querySelector(".ds-chart-dot")?.getAttribute("y1"))).toBeCloseTo(100 - (100.25 / 104) * 100);
  });

  it("maps values onto a 1000 x 100 board, clamped, with a safe max", () => {
    expect(linePoints([0, 50, 100], 100)).toBe("0,100 500,50 1000,0");
    expect(linePoints([-5, 200], 100)).toBe("0,100 1000,0");
    expect(linePoints([1], 0)).toBe("0,0");
  });
});
