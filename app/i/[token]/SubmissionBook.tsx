import { Frank_Ruhl_Libre } from "next/font/google";
import type { Lang, LangContent, Question } from "./types";

const headingFont = Frank_Ruhl_Libre({ subsets: ["hebrew", "latin"], weight: ["500", "700"] });

export const BOOK_STYLES = `
  .sub-book-outer { }
  .sub-book { display: block; background: transparent; }
  .sub-page { padding: 0; }
  .sub-page-form { padding-top: 8px; }
  .sub-spine { display: none; }

  .sub-divider { border: none; border-top: 1px solid #e8e6e2; margin: 0 0 20px; }
  .sub-field-label { display: block; font-size: 11px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; color: #9a9a9a; margin-bottom: 8px; }

  .sub-photo-drop { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; min-height: 260px; cursor: pointer; border-radius: 14px; border: 1.5px dashed #d8d6d1; background: #fafaf9; text-align: center; overflow: hidden; }
  .sub-photo-drop.has-photo { cursor: default; border-style: solid; border-color: #e6e4e0; background: #eee; min-height: 320px; }
  .sub-photo-icon-circle { width: 44px; height: 44px; border-radius: 50%; background: #eceaf7; display: flex; align-items: center; justify-content: center; color: #6a75c9; }
  .sub-photo-text { font-size: 14px; font-weight: 600; color: #444; }
  .sub-photo-hint { font-size: 11px; letter-spacing: 1px; color: #b5b3ae; }
  .sub-photo-img { display: block; width: 100%; height: 100%; object-fit: cover; position: absolute; inset: 0; }
  .sub-photo-change { position: relative; z-index: 1; margin-top: auto; font-size: 12px; font-weight: 600; color: white; background: rgba(0,0,0,0.55); padding: 6px 14px; border-radius: 999px; }

  .sub-summary-top { display: flex; justify-content: flex-end; margin-bottom: 40px; }
  .sub-back-btn { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; padding: 10px 18px; border-radius: 999px; border: 1px solid #d8d6d1; background: white; color: #2f3f8f; cursor: pointer; }
  .sub-summary-body { display: grid; gap: 20px; text-align: center; }
  .sub-summary-heading { font-size: 15px; font-style: italic; color: #8a7f6f; margin: 0 0 4px; font-family: ${headingFont.style.fontFamily}; }
  .sub-summary-answer { font-size: 16px; color: #333; line-height: 1.9; margin: 0; white-space: pre-wrap; text-align: center; }
  .sub-summary-dateloc { margin-top: 8px; text-align: center; }
  .sub-summary-dateloc .sub-field-label { text-align: center; }
  .sub-date-display { display: inline-block; padding: 12px 14px; font-size: 14px; border: 1px solid #e6e4e0; border-radius: 10px; background: #f7f6f4; color: #555; }

  @media (min-width: 860px) {
    .sub-book-outer { padding: 22px 0; border-radius: 20px; }
    .sub-book {
      display: flex;
      align-items: stretch;
      position: relative;
      background: white;
      border-radius: 14px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05), 0 20px 45px -18px rgba(0,0,0,0.22);
      overflow: hidden;
      height: 640px;
      max-width: 1000px;
      margin: 0 auto;
    }
    .sub-page { flex: 1; min-width: 0; position: relative; }
    .sub-page-form { padding: 40px 40px 32px; display: flex; flex-direction: column; height: 100%; box-sizing: border-box; }
    .sub-page-form-top { flex-shrink: 0; }
    .sub-page-form-scroll { flex: 1; min-height: 0; overflow-y: auto; margin: 4px -8px 0; padding: 0 8px; }
    .sub-page-form-bottom { flex-shrink: 0; padding-top: 16px; }
    .sub-page-photo { padding: 28px; background: white; display: flex; }
    .sub-photo-drop { flex: 1; min-height: 0; }
    .sub-spine {
      display: block;
      position: absolute;
      top: 0;
      bottom: 0;
      left: 50%;
      width: 1px;
      margin-left: 0;
      z-index: 3;
      pointer-events: none;
      background: #ece9e4;
    }
  }
`;

export function PhotoPage({ photoUrl }: { photoUrl: string | null }) {
  return (
    <div className="sub-page sub-page-photo">
      <div className={`sub-photo-drop${photoUrl ? " has-photo" : ""}`}>
        {photoUrl && <img src={photoUrl} alt="" className="sub-photo-img" />}
      </div>
    </div>
  );
}

export default function SubmissionBook({
  content,
  lang,
  answers,
  questions,
  dateLocation,
  photoUrl,
  blessingText,
  blessingSignedBy,
  onBackToEdit,
}: {
  content: Record<Lang, LangContent>;
  lang: Lang;
  answers: Record<string, string>;
  questions: Question[];
  dateLocation: string;
  photoUrl: string | null;
  blessingText?: string | null;
  blessingSignedBy?: string | null;
  onBackToEdit: () => void;
}) {
  const c = content[lang];
  const answeredQuestions = questions.filter((q) => (answers[q.id] ?? "").trim().length > 0);

  return (
    <div className="sub-book-outer">
      <div className="sub-book">
        <div className="sub-page sub-page-form">
          <div className="sub-summary-top">
            <button type="button" className="sub-back-btn" onClick={onBackToEdit}>
              <span>›</span> {c.backToEditLabel}
            </button>
          </div>

          <div className="sub-summary-body">
            <p className="sub-summary-heading">{c.answersHeading}</p>
            {answeredQuestions.map((q, i) => (
              <div key={q.id}>
                <p className="sub-summary-answer">{answers[q.id]}</p>
                {i < answeredQuestions.length - 1 && <hr className="sub-divider" />}
              </div>
            ))}

            {blessingText?.trim() && (
              <div>
                {answeredQuestions.length > 0 && <hr className="sub-divider" />}
                <p className="sub-summary-answer">{blessingText}</p>
                {blessingSignedBy?.trim() && (
                  <p style={{ fontSize: 13, color: "#8a7f6f", marginTop: 8, fontStyle: "italic" }}>
                    — {blessingSignedBy}
                  </p>
                )}
              </div>
            )}

            {dateLocation.trim() && (
              <div className="sub-summary-dateloc">
                <span className="sub-field-label">{c.dateLocationLabel}</span>
                <div className="sub-date-display">{dateLocation}</div>
              </div>
            )}
          </div>
        </div>

        <div className="sub-spine" />

        <PhotoPage photoUrl={photoUrl} />
      </div>
    </div>
  );
}
