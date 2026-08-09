import type { Lang, LangContent } from "../types";
import type { IntroGuidance } from "../content";
import { StepProgress } from "../SubmissionBook";

// Russian/English are LTR languages — their free text (headline, opening
// text, guidance) should read left-to-right and hug the left edge, even
// though the page chrome around it stays RTL.
export default function IntroStep({
  lang,
  projectName,
  c,
  eventTypeLabel,
  introText,
  guidance,
  stepNumber,
  stepTotal,
  onStart,
}: {
  lang: Lang;
  projectName: string;
  c: LangContent;
  eventTypeLabel: string;
  introText: string;
  guidance?: IntroGuidance;
  stepNumber: number;
  stepTotal: number;
  onStart: () => void;
}) {
  return (
    <div className="sub-page sub-page-form" dir={lang === "HE" ? "rtl" : "ltr"}>
      <div className="sub-page-form-top">
        <p className="sub-eyebrow">{eventTypeLabel}</p>
        <StepProgress current={stepNumber} total={stepTotal} />
        <h1 className="sub-heading">{projectName}</h1>
        <hr className="sub-divider" />
      </div>

      <div className="sub-page-form-scroll">
        <p className="sub-opening-text">{introText}</p>

        {guidance && (
          <div className="sub-intro-guidance">
            <p className="sub-intro-guidance-heading">{guidance.stepsHeading}</p>

            {/* Desktop keeps the plain numbered list; mobile shows the same
                steps as bordered cards with a circle badge instead (CSS
                toggles which one is visible — see WIZARD_EXTRA_STYLES). */}
            <ol className="sub-intro-guidance-steps">
              {guidance.steps.map((step, i) => (
                <li key={i}>
                  <strong>{step.title}:</strong> {step.body}
                </li>
              ))}
            </ol>
            <div className="sub-intro-step-list">
              {guidance.steps.map((step, i) => (
                <div className="sub-intro-step-card" key={i}>
                  <div className="sub-intro-step-text">
                    <strong>{step.title}:</strong> {step.body}
                  </div>
                  <span className="sub-intro-step-badge">{i + 1}</span>
                </div>
              ))}
            </div>

            <p className="sub-intro-guidance-heading">{guidance.closingHeading}</p>
            <p className="sub-intro-guidance-closing">{guidance.closingBody}</p>
          </div>
        )}
      </div>

      <div className="sub-page-form-bottom">
        <div className="sub-actions">
          <button type="button" className="sub-btn sub-btn-send" onClick={onStart}>
            {c.startLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
