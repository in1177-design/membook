import type { Lang } from "../types";

// "Forward" points toward the start of the reading direction (left in
// RTL/Hebrew, right in LTR/Russian & English) — same convention used for the
// admin build page's ‹ › quick-nav arrows.
function ChevronIcon({ lang, forward = false, color }: { lang: Lang; forward?: boolean; color: string }) {
  const pointsLeft = forward ? lang === "HE" : lang !== "HE";
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
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

// Shared bottom nav for step pages: one full-width primary "continue" button
// plus a plain-text "back" link below it — the pattern from the Step 3
// (choose question) mockup, now reused across steps instead of the older
// side-by-side draft/send button pair.
export default function StepBottomNav({
  lang,
  continueLabel,
  onContinue,
  continueDisabled,
  backLabel,
  onBack,
  isSaving,
  error,
}: {
  lang: Lang;
  continueLabel: string;
  onContinue: () => void;
  continueDisabled?: boolean;
  backLabel: string;
  onBack: () => void;
  isSaving?: boolean;
  error?: string | null;
}) {
  return (
    <div className="sub-page-form-bottom sub-step-bottom">
      {error && <p style={{ color: "#b00020", marginBottom: 12, fontSize: 13 }}>{error}</p>}
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
  );
}
