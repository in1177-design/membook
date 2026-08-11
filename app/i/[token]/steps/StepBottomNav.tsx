import type { ReactNode } from "react";
import type { Lang } from "../types";

// "Forward" points toward the start of the reading direction (left in
// RTL/Hebrew, right in LTR/Russian & English) — same convention used for the
// admin build page's ‹ › quick-nav arrows.
function ChevronIcon({ lang, forward = false, color }: { lang: Lang; forward?: boolean; color: string }) {
  const pointsLeft = forward ? lang === "HE" : lang !== "HE";
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }} aria-hidden="true">
      <path
        d={pointsLeft ? "M10 3 5 8l5 5" : "M6 3l5 5-5 5"}
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Shared bottom nav for step pages. Mobile (default): one full-width primary
// "continue" button plus a compact bordered "back" link below it — the
// pattern from designe/final figma, with a subtle border added to the back
// link (not the Figma reference's bare text) for tap-discoverability.
// Desktop: the original 2-buttons-in-a-row layout, unchanged — see the
// @container block in SubmissionWizard's WIZARD_EXTRA_STYLES.
export default function StepBottomNav({
  lang,
  continueLabel,
  onContinue,
  continueDisabled,
  backLabel,
  onBack,
  isSaving,
  error,
  beforeButtons,
}: {
  lang: Lang;
  continueLabel: string;
  onContinue: () => void;
  continueDisabled?: boolean;
  backLabel: string;
  onBack: () => void;
  isSaving?: boolean;
  error?: string | null;
  // Extra content rendered above the buttons, still inside the same (fixed
  // on mobile) wrapper — currently only used by PhotoStep for its "add a
  // photo later" hint card. Optional so every other caller is unaffected.
  beforeButtons?: ReactNode;
}) {
  return (
    <div className="sub-page-form-bottom sub-step-bottom">
      {beforeButtons}
      {error && <p style={{ color: "#b00020", marginBottom: 12, fontSize: 13 }}>{error}</p>}
      {/* Buttons live in their own row so beforeButtons/error always stack
          above them, at every width — only this inner row switches to
          row-reverse at desktop (see @container in WIZARD_EXTRA_STYLES).
          Previously the row-reverse was on the outer .sub-step-bottom
          itself, which was harmless while beforeButtons was mobile-only,
          but once a beforeButtons node (e.g. PhotoStep's hint line) started
          rendering at every width, it got pulled into the same row as the
          buttons instead of sitting above them. */}
      <div className="sub-step-buttons-row">
        <button
          type="button"
          className="sub-btn sub-btn-send sub-step-continue"
          disabled={continueDisabled || isSaving}
          onClick={onContinue}
        >
          <span>{isSaving ? "..." : continueLabel}</span>
          <ChevronIcon lang={lang} forward color="white" />
        </button>
        <button type="button" className="sub-step-back" onClick={onBack} disabled={isSaving}>
          <ChevronIcon lang={lang} color="#3b57d6" />
          <span>{backLabel}</span>
        </button>
      </div>
    </div>
  );
}
