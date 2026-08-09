import { questionHelper, questionText, type Lang, type LangContent, type Question } from "../types";
import { QUESTION_SHORT_LABEL, STEP_OF_LABEL } from "../content";
import StepBottomNav from "./StepBottomNav";
import { StepProgress } from "../SubmissionBook";

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
  stepNumber,
  stepTotal,
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
  stepNumber: number;
  stepTotal: number;
}) {
  return (
    <div className="sub-page sub-page-form">
      <div className="sub-page-form-top">
        <p className="sub-eyebrow">
          {STEP_OF_LABEL[lang](stepNumber, stepTotal)} · {QUESTION_SHORT_LABEL[lang]}
        </p>
        <StepProgress current={stepNumber} total={stepTotal} />
        <h1 className="sub-heading">{questionText(question, lang)}</h1>
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

      <StepBottomNav
        lang={lang}
        continueLabel={c.nextLabel}
        onContinue={onNext}
        backLabel={c.backLabel}
        onBack={onBack}
        isSaving={isSaving}
        error={error}
      />
    </div>
  );
}
