"use client";

import { useMemo, useState } from "react";
import { DashFoot, DashTop, Pill, Stat } from "@/components/dashboard-shell";
import { SAMPLE, formatReport, inspect, isBlank, verdict } from "@/lib/seo";

const SAMPLE_LABEL = "https://bookchaowalit.com";

export default function Home() {
  const [url, setUrl] = useState(SAMPLE_LABEL);
  const [html, setHtml] = useState(SAMPLE);
  const [copied, setCopied] = useState<"idle" | "done" | "failed">("idle");
  const report = useMemo(() => inspect(html), [html]);
  const blank = isBlank(html);
  // The page opens on (and resets to) demo HTML; say so wherever the score shows, not only "No crawl".
  const isSample = html === SAMPLE;
  const applicable = report.checks.filter((check) => check.applicable);
  const passed = applicable.filter((check) => check.ok).length;
  const skipped = report.checks.length - applicable.length;

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(formatReport(url, report, isSample));
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
            <p>Six checks on the HTML you paste <Pill tone="grey">No crawl</Pill>{isSample ? <> <Pill tone="grey">Sample data</Pill></> : null}</p>
          </div>
        </div>

        <ul className="ds-stats" aria-label="Result at a glance">
          <Stat label="Score" value={blank ? "—" : report.score} unit={blank ? undefined : "/ 100"} note={blank ? "paste HTML to score" : isSample ? `${verdict(report.score)}, sample HTML` : verdict(report.score)} />
          <Stat label="Checks passed" value={blank ? "—" : `${passed} / ${applicable.length}`} note={blank ? "nothing checked yet" : `${passed === applicable.length ? "nothing to fix" : `${applicable.length - passed} to fix`}${skipped ? `, ${skipped} not applicable` : ""}`} />
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
            {blank ? (
              <>
                <div className="ds-panel-head">
                  <div>
                    <h2 id="checks-heading">No HTML yet</h2>
                    <p>Nothing to score</p>
                  </div>
                </div>
                <p className="ds-callout" role="status">
                  <strong>Paste a page&apos;s HTML to check it</strong>
                  <span>The six checks and the score appear here once the HTML box has something in it.</span>
                </p>
              </>
            ) : (
              <>
                <div className="ds-panel-head">
                  <div>
                    <h2 id="checks-heading">{verdict(report.score)}</h2>
                    <p>{report.score} out of 100{isSample ? " · from the sample HTML" : ""}</p>
                  </div>
                </div>
                <div className="ds-meter" role="img" aria-label={`${report.score} out of 100`}><span style={{ width: `${report.score}%` }} /></div>
                <ul className="ds-rows" style={{ marginTop: 8 }}>
                  {report.checks.map((check) => (
                    <li key={check.name} className="ds-row">
                      <span className="ds-row-name">{check.name}</span>
                      <span className="ds-row-detail">{check.detail}</span>
                      <span className="ds-row-value">{check.applicable ? <Pill tone={check.ok ? "green" : "red"}>{check.ok ? "Pass" : "Fail"}</Pill> : <Pill tone="grey">N/A</Pill>}</span>
                    </li>
                  ))}
                </ul>
                <div className="ds-actions" style={{ marginTop: 12 }}>
                  <button type="button" className="ds-button" onClick={copyReport}>{copied === "done" ? "Copied" : "Copy report"}</button>
                  <span className="ds-sr" role="status">{copied === "done" ? "Report copied." : copied === "failed" ? "Copy failed. Select the checks and copy them by hand." : ""}</span>
                  {copied === "failed" ? <span className="ds-note">Copy failed in this browser.</span> : null}
                </div>
              </>
            )}
          </section>
        </div>

        <p className="ds-note">The score comes only from the HTML in the box: title, description, heading, image alt text and links. Nothing is sent to the URL, and it is not a ranking prediction.</p>
      </main>

      <DashFoot source="https://github.com/bookchaowalit-website/marketing-seo-analyzer-web" />
    </div>
  );
}
