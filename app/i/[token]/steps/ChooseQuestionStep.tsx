import { questionHelper, questionText, type Lang, type LangContent, type Question } from "../types";

const STEP_TITLE: Record<Lang, string> = {
  HE: "בחר/י שאלה אחת לענות עליה",
  RU: "Выберите один вопрос, на который хотите ответить",
  EN: "Choose one question to answer",
};

const CHOOSE_LABEL: Record<Lang, string> = {
  HE: "אני רוצה לענות על זה",
  RU: "Я хочу ответить на этот вопрос",
  EN: "I want to answer this",
};

export default function ChooseQuestionStep({
  questions,
  lang,
  c,
  onChoose,
  onBack,
}: {
  questions: Question[];
  lang: Lang;
  c: LangContent;
  onChoose: (questionId: string) => void;
  onBack: () => void;
}) {
  return (
    <div className="sub-page sub-page-form">
      <div className="sub-page-form-top">
        <p className="sub-eyebrow">{STEP_TITLE[lang]}</p>
      </div>

      <div className="sub-page-form-scroll">
        <div className="sub-questions">
          {questions.map((q, i) => (
            <div key={q.id} className="sub-q">
              <div className="sub-q-head" style={{ cursor: "default" }}>
                <span className="sub-q-avatar">{i + 1}</span>
                <span className="sub-q-title" style={{ whiteSpace: "normal" }}>
                  {questionText(q, lang)}
                </span>
              </div>
              <div className="sub-q-body">
                {questionHelper(q, lang) && <p className="sub-q-helper">{questionHelper(q, lang)}</p>}
                <button type="button" className="sub-btn sub-btn-send" onClick={() => onChoose(q.id)}>
                  {CHOOSE_LABEL[lang]}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="sub-page-form-bottom">
        <div className="sub-actions">
          <button type="button" className="sub-btn sub-btn-draft" onClick={onBack}>
            {c.backLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
