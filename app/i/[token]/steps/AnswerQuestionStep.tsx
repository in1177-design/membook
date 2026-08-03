import { questionHelper, questionText, type Lang, type LangContent, type Question } from "../types";

const STEP_TITLE: Record<Lang, string> = {
  HE: "התשובה שלך",
  RU: "Ваш ответ",
  EN: "Your answer",
};

export default function AnswerQuestionStep({
  question,
  lang,
  c,
  answer,
  onAnswerChange,
  onBack,
  onNext,
  isSaving,
  error,
}: {
  question: Question;
  lang: Lang;
  c: LangContent;
  answer: string;
  onAnswerChange: (text: string) => void;
  onBack: () => void;
  onNext: () => void;
  isSaving: boolean;
  error: string | null;
}) {
  return (
    <div className="sub-page sub-page-form">
      <div className="sub-page-form-top">
        <p className="sub-eyebrow">{STEP_TITLE[lang]}</p>
        <h1 className="sub-heading" style={{ fontSize: 19 }}>
          {questionText(question, lang)}
        </h1>
        {questionHelper(question, lang) && <p className="sub-q-helper">{questionHelper(question, lang)}</p>}
      </div>

      <div className="sub-page-form-scroll">
        <textarea
          className="sub-q-textarea"
          value={answer}
          onChange={(e) => onAnswerChange(e.target.value)}
          rows={8}
          autoFocus
        />
      </div>

      <div className="sub-page-form-bottom">
        {error && <p style={{ color: "#b00020", marginBottom: 12, fontSize: 13 }}>{error}</p>}
        <div className="sub-actions">
          <button type="button" className="sub-btn sub-btn-draft" onClick={onBack} disabled={isSaving}>
            {c.backLabel}
          </button>
          <button type="button" className="sub-btn sub-btn-send" onClick={onNext} disabled={isSaving}>
            {isSaving ? "..." : c.nextLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
