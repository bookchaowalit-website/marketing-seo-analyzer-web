"use client";

import { useMemo, useState } from "react";
import { DashFoot, DashTop, Pill, Stat } from "@/components/dashboard-shell";
import { SAMPLE, formatReport, inspect, verdict } from "@/lib/seo";

const SAMPLE_LABEL = "https://bookchaowalit.com";

export default function Home() {
  const [url, setUrl] = useState(SAMPLE_LABEL);
  const [html, setHtml] = useState(SAMPLE);
  const [copied, setCopied] = useState<"idle" | "done" | "failed">("idle");
  const report = useMemo(() => inspect(html), [html]);
  const passed = report.checks.filter((check) => check.ok).length;

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(formatReport(url, report));
      setCopied("done");
      window.setTimeout(() => setCopied("idle"), 1500);
    } catch {
      setCopied("failed");
    }
  };
  const reset = () => {
    setUrl(SAMPLE_LABEL);
    setHtml(SAMPLE);
    setCopied("idle");
  };

  return (
    <div className="ds">
      <a className="ds-skip" href="#main">Skip to content</a>
      <DashTop name="SEO check" tagline="Basic on-page checks" />

      <main id="main" tabIndex={-1} className="ds-main">
        <div className="ds-head">
          <div>
            <h1>On-page SEO</h1>
            <p>Six checks on the HTML you paste <Pill tone="grey">No crawl</Pill></p>
          </div>
        </div>

        <ul className="ds-stats" aria-label="Result at a glance">
          <Stat label="Score" value={report.score} unit="/ 100" note={verdict(report.score)} />
          <Stat label="Checks passed" value={`${passed} / ${report.checks.length}`} note={passed === report.checks.length ? "nothing to fix" : `${report.checks.length - passed} to fix`} />
          <Stat label="Snapshot" value={html.length.toLocaleString("en-US")} unit="chars" note="updates as you type" />
        </ul>

        <div className="ds-grid">
          <section className="ds-panel" aria-labelledby="source-heading">
            <div className="ds-panel-head">
              <div>
                <h2 id="source-heading">Snapshot</h2>
                <p>Paste the page&apos;s HTML; the URL is only a label</p>
              </div>
              <button type="button" className="ds-plain" onClick={reset}>Reset sample</button>
            </div>
            <div className="ds-form">
              <label className="ds-field">URL label
                <input className="ds-input" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com" autoComplete="off" />
              </label>
              <label className="ds-field">HTML
                <textarea className="ds-input" value={html} onChange={(event) => setHtml(event.target.value)} spellCheck={false} />
              </label>
            </div>
          </section>

          <section className="ds-panel" aria-labelledby="checks-heading">
            <div className="ds-panel-head">
              <div>
                <h2 id="checks-heading">{verdict(report.score)}</h2>
                <p>{report.score} out of 100</p>
              </div>
            </div>
            <div className="ds-meter" role="img" aria-label={`${report.score} out of 100`}><span style={{ width: `${report.score}%` }} /></div>
            <ul className="ds-rows" style={{ marginTop: 8 }}>
              {report.checks.map((check) => (
                <li key={check.name} className="ds-row">
                  <span className="ds-row-name">{check.name}</span>
                  <span className="ds-row-detail">{check.detail}</span>
                  <span className="ds-row-value"><Pill tone={check.ok ? "green" : "red"}>{check.ok ? "Pass" : "Fail"}</Pill></span>
                </li>
              ))}
            </ul>
            <div className="ds-actions" style={{ marginTop: 12 }}>
              <button type="button" className="ds-button" onClick={copyReport}>{copied === "done" ? "Copied" : "Copy report"}</button>
              <span className="ds-sr" role="status">{copied === "done" ? "Report copied." : copied === "failed" ? "Copy failed. Select the checks and copy them by hand." : ""}</span>
              {copied === "failed" ? <span className="ds-note">Copy failed in this browser.</span> : null}
            </div>
          </section>
        </div>

        <p className="ds-note">The score comes only from the HTML in the box: title, description, heading, image alt text and links. Nothing is sent to the URL, and it is not a ranking prediction.</p>
      </main>

      <DashFoot source="https://github.com/bookchaowalit-website/marketing-seo-analyzer-web" />
    </div>
  );
}
