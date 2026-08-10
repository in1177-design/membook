"use client";

// The segmented step-progress bar at the top of every guest-wizard step
// (same component as StepProgress in app/i/[token]/SubmissionBook.tsx) —
// `current` pills (out of `total`) render filled. Styling lives in
// styles.tsx's .ds-progress-pill(.filled) rules; mount
// <DesignSystemStyles /> once per page that renders this.
export function ProgressPills({ current, total }: { current: number; total: number }) {
  return (
    <div className="ds-progress-pills" aria-hidden>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={`ds-progress-pill${i < current ? " filled" : ""}`} />
      ))}
    </div>
  );
}
