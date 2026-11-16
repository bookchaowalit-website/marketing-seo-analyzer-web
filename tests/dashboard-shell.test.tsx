// @vitest-environment happy-dom
import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ChartPanel, DashFoot, DashTop, Pill, Segmented, Stat, linePoints } from "@/components/dashboard-shell";

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
    press(button("Show table"));
    expect(button("Show chart").getAttribute("aria-pressed")).toBe("true");
    expect([...host.querySelectorAll("tbody tr")].map((row) => row.textContent)).toEqual(["001", "013 (peak)", "022"]);
    expect(host.querySelector('[role="region"]')?.getAttribute("aria-label")).toBe("Load as a table");
    press(button("Show chart"));
    expect(host.querySelector("svg")).not.toBeNull();
  });

  it("uses short tick text when given and draws no peak for an empty series", () => {
    render(<ChartPanel title="Clicks" summary="s" values={[]} labels={[]} ticks={[]} max={0} unit="%" labelHeading="Interval" />);
    expect(host.querySelector(".ds-chart-peak")).toBeNull();
    render(<ChartPanel title="Clicks" summary="s" values={[1, 2, 3]} labels={["a to b", "b to c", "c to d"]} ticks={[0, 2]} tickLabels={["−3h", "now"]} max={3} unit="%" labelHeading="Interval" />);
    expect([...host.querySelectorAll(".ds-chart-x span")].map((span) => span.textContent)).toEqual(["−3h", "now"]);
  });

  it("maps values onto a 1000 x 100 board, clamped, with a safe max", () => {
    expect(linePoints([0, 50, 100], 100)).toBe("0,100 500,50 1000,0");
    expect(linePoints([-5, 200], 100)).toBe("0,100 1000,0");
    expect(linePoints([1], 0)).toBe("0,0");
  });
});
