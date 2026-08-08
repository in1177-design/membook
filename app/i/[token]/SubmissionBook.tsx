import { Frank_Ruhl_Libre } from "next/font/google";
import { STEP_OF_LABEL } from "./content";
import { questionText, type Lang, type LangContent, type Question } from "./types";

const headingFont = Frank_Ruhl_Libre({ subsets: ["hebrew", "latin"], weight: ["500", "700"] });

// Copy for the "before sending" preview screen (Step 5) only — the "done"
// (already-submitted) screen reuses this same component but keeps its older,
// plainer corner-back-button layout below, since nothing here was asked to
// change it and "before sending" wording would be wrong once it's been sent.
const STEP_TITLE: Record<Lang, string> = {
  HE: "לפני השליחה",
  RU: "Перед отправкой",
  EN: "Before sending",
};
const PREVIEW_HEADING: Record<Lang, string> = {
  HE: "כך הברכה שלכם תיראה",
  RU: "Вот как будет выглядеть ваше пожелание",
  EN: "Here's how your blessing will look",
};
const PREVIEW_SUBTEXT: Record<Lang, string> = {
  HE: "עברו על הפרטים וודאו שהכל נראה כמו שרציתם.",
  RU: "Просмотрите детали и убедитесь, что всё выглядит так, как вы хотели.",
  EN: "Go over the details and make sure everything looks the way you wanted.",
};
const SEND_LABEL: Record<Lang, string> = { HE: "שליחה", RU: "Отправить", EN: "Send" };
const SECTION_BLESSING_LABEL: Record<Lang, string> = { HE: "הברכה", RU: "Пожелание", EN: "Blessing" };
const SECTION_QUESTION_LABEL: Record<Lang, string> = { HE: "השאלה שבחרתם", RU: "Выбранный вопрос", EN: "Your chosen question" };
const SECTION_PHOTO_LABEL: Record<Lang, string> = { HE: "התמונה שצירפתם", RU: "Прикреплённое фото", EN: "The photo you attached" };
const PHOTO_NOTE: Record<Lang, string> = {
  HE: "אפשר לשנות כל פרט לפני השליחה.",
  RU: "Перед отправкой можно изменить любую деталь.",
  EN: "You can change any detail before sending.",
};
// Shown instead of real content only in the admin build page's generic
// template preview (isAdminPreview) — there's no real guest yet to have
// written anything, so every section just says where their text will go.
const ADMIN_PLACEHOLDER: Record<Lang, string> = {
  HE: "כאן יוצג הטקסט שהמוזמן/ת יזינו.",
  RU: "Здесь появится текст, который введёт гость.",
  EN: "The guest's text will appear here.",
};

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

  .sub-preview-subtext { font-size: 13px; color: #8a8a8a; margin: 6px 0 0; }
  .sub-preview-section { border: 1px solid #ece9e4; border-radius: 14px; padding: 16px 18px; margin-bottom: 14px; }
  .sub-preview-section-title { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 700; color: #2b2b2b; margin: 0 0 10px; }
  .sub-preview-section-icon { flex-shrink: 0; width: 26px; height: 26px; border-radius: 50%; background: #f1effb; display: flex; align-items: center; justify-content: center; color: #7c6fdc; }
  .sub-preview-section-body { font-size: 14px; color: #666; line-height: 1.7; margin: 0; white-space: pre-wrap; }
  .sub-preview-question-text { font-size: 14px; font-weight: 700; color: #2b2b2b; margin: 0 0 10px; }
  .sub-preview-quote-box { border: 1px solid #ece9e4; border-radius: 10px; background: #faf9f7; padding: 14px 16px; font-size: 14px; color: #555; line-height: 1.7; white-space: pre-wrap; }
  .sub-preview-actions { display: flex; gap: 10px; padding-top: 4px; }
  .sub-preview-btn-back { flex: 1; padding: 12px 0; border-radius: 10px; border: 1px solid #d8d6d1; background: white; color: #333; font-size: 14px; font-weight: 700; cursor: pointer; }
  .sub-preview-btn-send { flex: 1; padding: 12px 0; border-radius: 10px; border: none; background: #7c4fd1; color: white; font-size: 14px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
  .sub-preview-btn-send:disabled, .sub-preview-btn-back:disabled { opacity: 0.6; cursor: default; }

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

function HeartIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path
        d="M8 13.5s-5.5-3.3-5.5-7.1C2.5 4.3 4 3 5.7 3c1 0 2 .5 2.3 1.3C8.3 3.5 9.3 3 10.3 3 12 3 13.5 4.3 13.5 6.4c0 3.8-5.5 7.1-5.5 7.1z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function QuestionIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6.2 6.3c.2-1 1-1.6 1.9-1.6 1 0 1.9.6 1.9 1.7 0 1-.9 1.4-1.5 1.9-.4.3-.5.6-.5 1.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="8" cy="11.3" r="0.7" fill="currentColor" />
    </svg>
  );
}

function PhotoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="3.5" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="6" cy="7" r="1" fill="currentColor" />
      <path d="M3 11l3.2-3 2.3 2 2-2.3L14 11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M14 2 6.7 9.3M14 2 9.7 14l-3-4.7L2 6.3 14 2Z" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// The text-side page only (no outer book/spine/photo) — a real guest's book
// always pairs this with a photo page (SubmissionBook below does that), but
// the admin build page already has its own outer "book" shell with its own
// trailing photo page for every step, so it renders this directly instead of
// the full SubmissionBook to avoid nesting one book inside another (which
// was producing a stray extra photo-placeholder column).
export function BookTextPage({
  content,
  lang,
  answers,
  questions,
  dateLocation,
  blessingText,
  blessingSignedBy,
  onBackToEdit,
  onConfirm,
  isSubmitting,
  error,
  stepNumber,
  stepTotal,
  isAdminPreview,
}: {
  content: Record<Lang, LangContent>;
  lang: Lang;
  answers: Record<string, string>;
  questions: Question[];
  dateLocation: string;
  blessingText?: string | null;
  blessingSignedBy?: string | null;
  onBackToEdit: () => void;
  // Present only for the real "before sending" preview (Step 5) — its
  // absence is how this component tells that apart from the plainer,
  // already-submitted "done" screen, which reuses it without these.
  onConfirm?: () => void;
  isSubmitting?: boolean;
  error?: string | null;
  stepNumber?: number;
  stepTotal?: number;
  // True only for the admin build page's generic Step 5 template preview —
  // there's no real guest submission behind it, so every section shows
  // placeholder copy instead of the (empty) real answers/blessingText props.
  isAdminPreview?: boolean;
}) {
  const c = content[lang];
  const answeredQuestions = questions.filter((q) => (answers[q.id] ?? "").trim().length > 0);
  const isBeforeSending = typeof onConfirm === "function";

  // The "before sending" question section: real answered question(s) for an
  // actual guest, or — in the admin's generic template preview, where
  // nothing's been answered yet — just the project's first configured
  // question, shown with placeholder body text.
  const questionSections = isAdminPreview
    ? questions.slice(0, 1).map((q) => ({ q, answerText: null as string | null }))
    : answeredQuestions.map((q) => ({ q, answerText: answers[q.id] }));

  const summary = isBeforeSending ? (
    <div>
      <div className="sub-preview-section">
        <p className="sub-preview-section-title">
          <span className="sub-preview-section-icon">
            <HeartIcon />
          </span>
          {SECTION_BLESSING_LABEL[lang]}
        </p>
        <p className="sub-preview-section-body">
          {isAdminPreview ? ADMIN_PLACEHOLDER[lang] : blessingText?.trim() || ADMIN_PLACEHOLDER[lang]}
        </p>
      </div>

      {questionSections.map(({ q, answerText }) => (
        <div className="sub-preview-section" key={q.id}>
          <p className="sub-preview-section-title">
            <span className="sub-preview-section-icon">
              <QuestionIcon />
            </span>
            {SECTION_QUESTION_LABEL[lang]}
          </p>
          <p className="sub-preview-question-text">{questionText(q, lang)}</p>
          <div className="sub-preview-quote-box">{answerText ?? ADMIN_PLACEHOLDER[lang]}</div>
        </div>
      ))}

      <div className="sub-preview-section">
        <p className="sub-preview-section-title">
          <span className="sub-preview-section-icon">
            <PhotoIcon />
          </span>
          {SECTION_PHOTO_LABEL[lang]}
        </p>
        <p className="sub-preview-section-body">{PHOTO_NOTE[lang]}</p>
      </div>
    </div>
  ) : (
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
            <p style={{ fontSize: 13, color: "#8a7f6f", marginTop: 8, fontStyle: "italic" }}>— {blessingSignedBy}</p>
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
  );

  return (
    <div className="sub-page sub-page-form">
      {isBeforeSending ? (
        <>
          <div className="sub-page-form-top">
            <p className="sub-eyebrow">
              {STEP_OF_LABEL[lang](stepNumber ?? 0, stepTotal ?? 0)} · {STEP_TITLE[lang]}
            </p>
            <h1 className="sub-heading">{PREVIEW_HEADING[lang]}</h1>
            <p className="sub-preview-subtext">{PREVIEW_SUBTEXT[lang]}</p>
          </div>
          <div className="sub-page-form-scroll">{summary}</div>
          <div className="sub-page-form-bottom">
            {error && <p style={{ color: "#b00020", marginBottom: 10, fontSize: 13 }}>{error}</p>}
            <div className="sub-preview-actions">
              <button type="button" className="sub-preview-btn-back" onClick={onBackToEdit} disabled={isSubmitting}>
                {c.backToEditLabel}
              </button>
              <button type="button" className="sub-preview-btn-send" onClick={onConfirm} disabled={isSubmitting}>
                <SendIcon />
                {isSubmitting ? "..." : SEND_LABEL[lang]}
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="sub-summary-top">
            <button type="button" className="sub-back-btn" onClick={onBackToEdit}>
              <span>›</span> {c.backToEditLabel}
            </button>
          </div>
          {summary}
        </>
      )}
    </div>
  );
}

// Full 2-page spread (text + photo) for the real guest flow, where nothing
// else already provides an outer book/photo shell — SubmissionWizard and its
// PreviewStep render this directly, standalone. The admin build page has its
// own outer shell already (see BookTextPage above) and must NOT use this,
// or the two book shells nest and produce a stray extra photo column.
export default function SubmissionBook(
  props: Parameters<typeof BookTextPage>[0] & { photoUrl: string | null }
) {
  const { photoUrl, ...pageProps } = props;
  return (
    <div className="sub-book-outer">
      <div className="sub-book">
        <BookTextPage {...pageProps} />
        <div className="sub-spine" />
        <PhotoPage photoUrl={photoUrl} />
      </div>
    </div>
  );
}
