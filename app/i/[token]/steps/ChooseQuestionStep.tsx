import { useState } from "react";
import { questionText, type Lang, type LangContent, type Question } from "../types";
import { QUESTION_SHORT_LABEL, STEP_OF_LABEL } from "../content";
import StepBottomNav from "./StepBottomNav";
import { StepProgress } from "../SubmissionBook";

const STEP_TITLE: Record<Lang, string> = {
  HE: "בחרו שאלה אחת שתרצו לענות עליה",
  RU: "Выберите один вопрос, на который хотите ответить",
  EN: "Choose one question you'd like to answer",
};
const SURPRISE_LABEL: Record<Lang, string> = {
  HE: "לא יודעים מה לבחור? בחרו עבורי שאלה",
  RU: "Не знаете, что выбрать? Выберите вопрос за меня",
  EN: "Not sure what to pick? Choose a question for me",
};
const CONTINUE_LABEL: Record<Lang, string> = {
  HE: "המשך עם השאלה שבחרתי",
  RU: "Продолжить с выбранным вопросом",
  EN: "Continue with my question",
};

export default function ChooseQuestionStep({
  questions,
  lang,
  c,
  selectedId: initialSelectedId,
  onChoose,
  onBack,
  stepNumber,
  stepTotal,
}: {
  questions: Question[];
  lang: Lang;
  c: LangContent;
  selectedId?: string | null;
  onChoose: (questionId: string) => void;
  onBack: () => void;
  stepNumber: number;
  stepTotal: number;
}) {
  const [selected, setSelected] = useState<string | null>(initialSelectedId ?? null);

  function pickForMe() {
    if (questions.length === 0) return;
    const pick = questions[Math.floor(Math.random() * questions.length)];
    setSelected(pick.id);
  }

  return (
    <div className="sub-page sub-page-form" dir={lang === "HE" ? "rtl" : "ltr"}>
      <div className="sub-page-form-top">
        <p className="sub-eyebrow">
          {STEP_OF_LABEL[lang](stepNumber, stepTotal)} · {QUESTION_SHORT_LABEL[lang]}
        </p>
        <StepProgress current={stepNumber} total={stepTotal} />
        <h1 className="sub-heading">{STEP_TITLE[lang]}</h1>
      </div>

      <div className="sub-page-form-scroll">
        <div className="sub-choose-list">
          {questions.map((q) => {
            const isSelected = selected === q.id;
            return (
              <button
                type="button"
                key={q.id}
                className={`sub-choose-option${isSelected ? " selected" : ""}`}
                onClick={() => setSelected(q.id)}
              >
                <span className="sub-choose-option-text">{questionText(q, lang)}</span>
                <span className={`sub-choose-radio${isSelected ? " checked" : ""}`}>{isSelected && <CheckIcon />}</span>
              </button>
            );
          })}

          <button type="button" className="sub-choose-surprise" onClick={pickForMe}>
            <span>{SURPRISE_LABEL[lang]}</span>
            <span aria-hidden>✨</span>
          </button>
        </div>
      </div>

      <StepBottomNav
        lang={lang}
        continueLabel={CONTINUE_LABEL[lang]}
        continueDisabled={!selected}
        onContinue={() => selected && onChoose(selected)}
        backLabel={c.backLabel}
        onBack={onBack}
      />
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
      <path d="M3 8.5 6.2 12 13 4.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
