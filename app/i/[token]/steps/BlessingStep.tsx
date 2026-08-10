import type { Lang, LangContent } from "../types";
import { STEP_OF_LABEL } from "../content";
import StepBottomNav from "./StepBottomNav";
import { StepProgress } from "../SubmissionBook";

const STEP_TITLE: Record<Lang, string> = {
  HE: "ברכה וחתימה",
  RU: "Пожелание и подпись",
  EN: "Blessing & signature",
};
const SIGNED_BY_LABEL: Record<Lang, string> = { HE: "השם שלכם", RU: "Ваше имя", EN: "Your name" };
const BLESSING_PLACEHOLDER: Record<Lang, string> = {
  HE: "כתבו כאן את הברכה שלכם...",
  RU: "Напишите здесь ваше поздравление...",
  EN: "Write your blessing here...",
};
const CONTINUE_LABEL: Record<Lang, string> = { HE: "המשך", RU: "Продолжить", EN: "Continue" };

export default function BlessingStep({
  lang,
  c,
  blessingText,
  blessingSignedBy,
  blessingPromptText,
  onBlessingTextChange,
  onBlessingSignedByChange,
  onBack,
  onNext,
  isSaving,
  error,
  stepNumber,
  stepTotal,
}: {
  lang: Lang;
  c: LangContent;
  blessingText: string;
  blessingSignedBy: string;
  blessingPromptText: string;
  onBlessingTextChange: (text: string) => void;
  onBlessingSignedByChange: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
  isSaving: boolean;
  error: string | null;
  stepNumber: number;
  stepTotal: number;
}) {
  return (
    <div className="sub-page sub-page-form" dir={lang === "HE" ? "rtl" : "ltr"}>
      <div className="sub-page-form-top">
        <p className="sub-eyebrow">
          {STEP_OF_LABEL[lang](stepNumber, stepTotal)} · {STEP_TITLE[lang]}
        </p>
        <StepProgress current={stepNumber} total={stepTotal} />
        {/* The admin's guidance text stays visible as a heading, not a
            placeholder — a placeholder disappears the moment the guest
            starts typing, right when they'd still want the prompt in view. */}
        <h1 className="sub-heading" id="sub-blessing-heading">
          {blessingPromptText}
        </h1>
      </div>

      <div className="sub-page-form-scroll">
        <div style={{ display: "grid", gap: 14 }}>
          <textarea
            className="sub-q-textarea"
            aria-labelledby="sub-blessing-heading"
            value={blessingText}
            onChange={(e) => onBlessingTextChange(e.target.value)}
            placeholder={BLESSING_PLACEHOLDER[lang]}
            rows={6}
            autoFocus
          />
          <label>
            <span className="sub-field-label">{SIGNED_BY_LABEL[lang]}</span>
            <input
              className="sub-text-input"
              style={{ marginTop: 8 }}
              value={blessingSignedBy}
              onChange={(e) => onBlessingSignedByChange(e.target.value)}
            />
          </label>
        </div>
      </div>

      <StepBottomNav
        lang={lang}
        continueLabel={CONTINUE_LABEL[lang]}
        onContinue={onNext}
        backLabel={c.backLabel}
        onBack={onBack}
        isSaving={isSaving}
        error={error}
      />
    </div>
  );
}
