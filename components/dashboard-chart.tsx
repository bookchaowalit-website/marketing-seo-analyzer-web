"use client";

import { useId, useState, type ReactNode } from "react";

/** The top of the scale: `max`, or 1 when `max` is not above 0, so the line and the y labels agree. */
export function chartTop(max: number): number {
  return max > 0 ? max : 1;
}

/** The five y-axis labels (0 to the top), with enough decimals that no two grid lines share a label. */
export function axisSteps(max: number): number[] {
  const top = chartTop(max);
  // One decimal more than the gap between grid lines needs: 0.75 → 2, 0.0005 → 5, 250 → 0.
  const decimals = Math.min(Math.max(Math.ceil(-Math.log10(top / 4)) + 1, 0), 20);
  return [0, 0.25, 0.5, 0.75, 1].map((share) => Number((top * share).toFixed(decimals)));
}

/** Polyline points on a 1000 x 100 board, 0 at the bottom and `max` at the top. */
export function linePoints(values: number[], max: number): string {
  const last = Math.max(values.length - 1, 1);
  const top = chartTop(max);
  return values.map((value, index) => `${(index / last) * 1000},${100 - (Math.min(Math.max(value, 0), top) / top) * 100}`).join(" ");
}

type ChartProps = {
  title: string;
  subtitle?: ReactNode;
  /** What the chart shows, read out instead of the drawing. */
  summary: string;
  values: number[];
  /** Label for each value, used by the table and the x axis. */
  labels: string[];
  /** Indexes of the labels shown under the chart. */
  ticks: number[];
  /** Shorter text for each tick when the table labels are too long for the axis (same order as `ticks`). */
  tickLabels?: string[];
  max: number;
  unit: string;
  /** Column heading for the labels in the table view. */
  labelHeading: string;
};

/** One line chart with a "Show table" switch, so every value can be read without the drawing. */
export function ChartPanel({ title, subtitle, summary, values, labels, ticks, tickLabels, max, unit, labelHeading }: ChartProps) {
  const [asTable, setAsTable] = useState(false);
  const headingId = useId();
  const points = linePoints(values, max);
  const dotY = points.split(",")[1];
  const peak = values.length ? values.indexOf(Math.max(...values)) : -1;
  // Same top as linePoints, and fractions kept (max 3 gives 0, 0.75, 1.5 …), so the labels match the line.
  const steps = axisSteps(max);
  return (
    <section className="ds-panel" aria-labelledby={headingId}>
      <div className="ds-panel-head">
        <div>
          <h2 id={headingId}>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        <button type="button" className="ds-plain" aria-pressed={asTable} onClick={() => setAsTable(!asTable)}>{asTable ? "Show chart" : "Show table"}</button>
      </div>
      {asTable ? (
        <div className="ds-table-wrap" tabIndex={0} role="region" aria-label={`${title} as a table`}>
          <table className="ds-table">
            <thead><tr><th scope="col">{labelHeading}</th><th scope="col">{unit}</th></tr></thead>
            <tbody>
              {values.map((value, index) => (
                <tr key={index} data-peak={index === peak ? "true" : undefined}>
                  <th scope="row">{labels[index]}</th>
                  <td>{value}{index === peak ? " (peak)" : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="ds-chart">
          <div className="ds-chart-y" aria-hidden="true">{steps.map((step, index) => <span key={index}>{step}</span>)}</div>
          <svg viewBox="0 0 1000 100" preserveAspectRatio="none" role="img" aria-label={summary}>
            <g className="ds-chart-grid">{[0, 25, 50, 75, 100].map((y) => <line key={y} x1="0" x2="1000" y1={y} y2={y} />)}</g>
            {/* One value has no line to draw or area to fill, so it gets a dot where it is. */}
            {values.length > 1 ? <polygon className="ds-chart-area" points={`0,100 ${points} 1000,100`} /> : null}
            {peak >= 0 ? <line className="ds-chart-peak" x1={(peak / Math.max(values.length - 1, 1)) * 1000} x2={(peak / Math.max(values.length - 1, 1)) * 1000} y1="0" y2="100" /> : null}
            {values.length === 1 ? <line className="ds-chart-dot" x1="0" x2="0" y1={dotY} y2={dotY} /> : <polyline className="ds-chart-line" points={points} />}
          </svg>
          <div className="ds-chart-x" aria-hidden="true">
            {ticks.map((tick, position) => {
              // Same x scale as linePoints, so each label sits under its own point.
              const at = tick / Math.max(values.length - 1, 1);
              return <span key={tick} style={{ left: `${at * 100}%` }} data-edge={at === 0 ? "start" : at === 1 ? "end" : undefined}>{tickLabels?.[position] ?? labels[tick]}</span>;
            })}
          </div>
        </div>
      )}
    </section>
  );
}
