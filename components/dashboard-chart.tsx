import { useId, type ReactNode } from "react";

/** One grid gap (a quarter of the scale), rounded up to two significant digits: 25 → 25, 12.5 → 13, 0.75 → 0.75. */
function axisStep(max: number): { step: number; decimals: number } {
  const raw = max > 0 ? max / 4 : 0.25;
  const exponent = Math.floor(Math.log10(raw)) - 1;
  const decimals = Math.min(Math.max(-exponent, 0), 20);
  // The small epsilon keeps float noise (50.000000000000004) from bumping a round gap up a step.
  const step = Number((Math.ceil(raw / 10 ** exponent - 1e-9) * 10 ** exponent).toFixed(decimals));
  return { step, decimals };
}

/** The top of the scale: four round grid gaps that reach at least `max` (1 when `max` is not above 0). */
export function chartTop(max: number): number {
  const { step, decimals } = axisStep(max);
  return Number((step * 4).toFixed(decimals));
}

/** The five y-axis labels (0 to the top); each is the exact value of its grid line, because the line uses the same top. */
export function axisSteps(max: number): number[] {
  const { step, decimals } = axisStep(max);
  return [0, 1, 2, 3, 4].map((index) => Number((step * index).toFixed(decimals)));
}

/** Polyline points on a 1000 x 100 board, 0 at the bottom and `chartTop(max)` at the top. */
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

/**
 * One line chart with a "Show table" disclosure, so every value can be read without the drawing.
 * The disclosure is a native <details>, so the table opens without JavaScript; CSS hides the chart while it is open.
 */
export function ChartPanel({ title, subtitle, summary, values, labels, ticks, tickLabels, max, unit, labelHeading }: ChartProps) {
  const headingId = useId();
  const points = linePoints(values, max);
  const dotY = points.split(",")[1];
  const peak = values.length ? values.indexOf(Math.max(...values)) : -1;
  // Same top as linePoints, so each label is the value of its grid line.
  const steps = axisSteps(max);
  // One label per position: a one-value series given ticks [0, 0] would stack two labels on one spot.
  const axis = ticks.map((tick, position) => ({ tick, text: tickLabels?.[position] ?? labels[tick] })).filter(({ tick }, index, all) => all.findIndex((other) => other.tick === tick) === index);
  return (
    <section className="ds-panel ds-chart-panel" aria-labelledby={headingId}>
      <div className="ds-panel-head">
        <div>
          <h2 id={headingId}>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
      </div>
      <details className="ds-chart-switch">
        <summary className="ds-plain">Show table</summary>
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
      </details>
      <div className="ds-chart">
        <div className="ds-chart-y" aria-hidden="true">{steps.map((step, index) => <span key={index}>{step}</span>)}</div>
        <svg viewBox="0 0 1000 100" preserveAspectRatio="none" role="img" aria-label={summary}>
          {/* One value has no line to draw or area to fill, so it gets a dot where it is. */}
          {values.length > 1 ? <polygon className="ds-chart-area" points={`0,100 ${points} 1000,100`} /> : null}
          {/* The grid comes after the filled area, so the opaque fill never hides the grid lines under the line. */}
          <g className="ds-chart-grid">{[0, 25, 50, 75, 100].map((y) => <line key={y} x1="0" x2="1000" y1={y} y2={y} />)}</g>
          {peak >= 0 ? <line className="ds-chart-peak" x1={(peak / Math.max(values.length - 1, 1)) * 1000} x2={(peak / Math.max(values.length - 1, 1)) * 1000} y1="0" y2="100" /> : null}
          {values.length === 1 ? <line className="ds-chart-dot" x1="0" x2="0" y1={dotY} y2={dotY} /> : <polyline className="ds-chart-line" points={points} />}
        </svg>
        <div className="ds-chart-x" aria-hidden="true">
          {axis.map(({ tick, text }) => {
            // Same x scale as linePoints, so each label sits under its own point.
            const at = tick / Math.max(values.length - 1, 1);
            return <span key={tick} style={{ left: `${at * 100}%` }} data-edge={at === 0 ? "start" : at === 1 ? "end" : undefined}>{text}</span>;
          })}
        </div>
      </div>
    </section>
  );
}
