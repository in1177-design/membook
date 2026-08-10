import type { Dispatch } from "react";
import { questionHelper, questionText, type Lang, type LangContent, type Question, type WizardAction } from "../types";

const STEP_TITLE: Record<Lang, string> = {
  HE: "כמה שאלות בשבילך",
  RU: "Несколько вопросов для вас",
  EN: "A few questions for you",
};

export default function QuestionsStep({
  questions,
  lang,
  c,
  answers,
  activeQuestionId,
  dispatch,
  onBlurAnswer,
  onBack,
  onNext,
}: {
  questions: Question[];
  lang: Lang;
  c: LangContent;
  answers: Record<string, string>;
  activeQuestionId: string | null;
  dispatch: Dispatch<WizardAction>;
  onBlurAnswer: (questionId: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="sub-page sub-page-form">
      <div className="sub-page-form-top">
        <p className="sub-eyebrow">{STEP_TITLE[lang]}</p>
      </div>

      <div className="sub-page-form-scroll">
        <div className="sub-questions">
          {questions.map((q, i) => {
            const isActive = activeQuestionId === q.id;
            const hasAnswer = (answers[q.id] ?? "").trim().length > 0;
            return (
              <div key={q.id} className={`sub-q${isActive ? " active" : ""}`}>
                <button
                  type="button"
                  className="sub-q-head"
                  onClick={() => dispatch({ type: "SET_ACTIVE_QUESTION", id: isActive ? null : q.id })}
                  aria-expanded={isActive}
                >
                  <span className="sub-q-avatar" aria-hidden="true">{i + 1}</span>
                  <span className="sub-q-title" id={`sub-q-title-${q.id}`}>{questionText(q, lang)}</span>
                  {hasAnswer && !isActive && <span className="sub-q-answered-dot" />}
                  <svg className="sub-q-chevron" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {isActive && (
                  <div className="sub-q-body">
                    {questionHelper(q, lang) && <p className="sub-q-helper">{questionHelper(q, lang)}</p>}
                    <textarea
                      className="sub-q-textarea"
                      aria-labelledby={`sub-q-title-${q.id}`}
                      value={answers[q.id] ?? ""}
                      onChange={(e) => dispatch({ type: "SET_ANSWER", questionId: q.id, text: e.target.value })}
                      onBlur={() => onBlurAnswer(q.id)}
                      rows={4}
                      autoFocus
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="sub-page-form-bottom">
        <div className="sub-actions">
          <button type="button" className="sub-btn sub-btn-draft" onClick={onBack}>
            {c.backLabel}
          </button>
          <button type="button" className="sub-btn sub-btn-send" onClick={onNext}>
            {c.nextLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
