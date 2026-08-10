import { STEP_OF_LABEL } from "./content";
import { questionText, type Lang, type LangContent, type Question } from "./types";

// Copy for the "before sending" preview screen (Step 5) — the only screen
// BookTextPage renders (the already-submitted "done" screen is a separate
// component, DoneStepForm in steps/DoneStep.tsx).
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
const SECTION_BLESSING_LABEL: Record<Lang, string> = { HE: "הברכה שלכם", RU: "Ваше пожелание", EN: "Your blessing" };
const SECTION_QUESTION_LABEL: Record<Lang, string> = { HE: "השאלה והתשובה", RU: "Вопрос и ответ", EN: "Question and answer" };
const SECTION_PHOTO_LABEL: Record<Lang, string> = { HE: "התמונה שלכם", RU: "Ваше фото", EN: "Your photo" };
const EDIT_LABEL: Record<Lang, string> = { HE: "עריכה", RU: "Изменить", EN: "Edit" };
// Shown instead of real content only in the admin build page's generic
// template preview (isAdminPreview) — there's no real guest yet to have
// written anything, so every section just says where their text will go.
const ADMIN_PLACEHOLDER: Record<Lang, string> = {
  HE: "כאן יוצג הטקסט שהמוזמן/ת יזינו.",
  RU: "Здесь появится текст, который введёт гость.",
  EN: "The guest's text will appear here.",
};

export const BOOK_STYLES = `
  /* container-type here (rather than a @media viewport query below) means the
     book's two-column layout responds to how wide ITS OWN box is, not the
     browser window — so a narrower wrapper (e.g. the admin preview pages'
     desktop/mobile toggle) actually reflows to the single-column mobile
     layout instead of just squeezing the two-column layout into less room. */
  .sub-book-outer { container-type: inline-size; }
  /* flex-column (not block) so the order property below can actually move
     the photo panel — order has no effect outside a flex/grid container.
     Mobile default: solid white (the page behind it, .invitee-bg, is a warm
     cream — the mockups show a clean white content area below the hero, not
     that cream showing through). Desktop's white background further down is
     unaffected (was already white there). */
  .sub-book { display: flex; flex-direction: column; background: #fff; }
  .sub-page { padding: 0; }
  .sub-page-form { padding-top: 8px; }
  .sub-spine { display: none; }

  /* Mobile default: the bottom nav (StepBottomNav, Intro's start button,
     Step 5's send/back, Done's back link — every step shares this one
     wrapper class) is pinned to the real bottom of the phone screen, same
     spot on every step regardless of content length, instead of trailing
     wherever the page's content happens to end. Real position:fixed against
     the true viewport — correct on the real guest link; the admin's
     simulated mobile preview (PreviewDeviceFrame, a width-constrained box in
     a normal desktop page, not a real narrow viewport) may pin this to the
     bottom of the admin page instead of the simulated frame — a known,
     accepted preview-only inaccuracy. */
  .sub-page-form-bottom {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 20;
    background: #fff;
    max-width: 1048px; /* matches page.tsx's <main> so it lines up with the content column above it */
    margin: 0 auto;
    padding: 14px 24px calc(14px + env(safe-area-inset-bottom));
    box-sizing: border-box;
    box-shadow: 0 -6px 16px rgba(0,0,0,0.05);
  }
  /* Reserves room so the last bit of scrollable content is never hidden
     underneath the now-fixed footer — one generous shared value rather than
     measuring each step's actual (varying) footer height. */
  .sub-page-form-scroll,
  .sub-page-form > .sub-actions {
    padding-bottom: 180px;
  }

  /* Mobile default: the in-book photo panel (guest's own photo, side-by-side
     with the form at desktop) is hidden entirely — its mobile role is taken
     over by .sub-mobile-hero below (a full-width banner rendered ahead of
     the book on the 3 steps that have one: intro, preview, done) and, on the
     preview step specifically, by the small thumbnail inside its own review
     card (see BookTextPage). */
  .sub-page-photo { display: none; }

  /* Full-bleed hero banner (intro / preview / done, mobile only) — a
     decorative photo (project cover, or the guest's own once uploaded, per
     each call site) with a wave cut along its bottom edge. Rendered as a
     sibling ahead of .sub-book inside .sub-book-outer specifically so it can
     participate in the same container-query scope (a plain sibling of
     .sub-book-outer couldn't respond to it). */
  .sub-mobile-hero { position: relative; margin: 0 -24px 20px; overflow: hidden; }
  .sub-mobile-hero img { display: block; width: 100%; height: 230px; object-fit: cover; }
  .sub-mobile-hero svg { position: absolute; bottom: -1px; left: 0; width: 100%; height: 40px; display: block; }

  /* Step 5 review card thumbnail + per-card edit link. */
  .sub-preview-photo-row { display: flex; align-items: center; gap: 12px; }
  .sub-preview-photo-thumb { flex-shrink: 0; width: 56px; height: 56px; border-radius: 8px; object-fit: cover; background: #f1effb; }
  .sub-preview-photo-name { font-size: 14px; color: #666; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .sub-preview-edit-link {
    display: inline-flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 700;
    color: #5838b8; background: none; border: none; padding: 0; cursor: pointer;
  }

  .sub-divider { border: none; border-top: 1px solid #e8e6e2; margin: 0 0 20px; }
  .sub-field-label { display: block; font-size: 11px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; color: #9a9a9a; margin-bottom: 8px; }

  .sub-photo-drop { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; min-height: 260px; cursor: pointer; border-radius: 14px; border: 1.5px dashed #d8d6d1; background: #f5f3ff; text-align: center; overflow: hidden; }
  .sub-photo-drop.has-photo { cursor: default; border-style: solid; border-color: #e6e4e0; background: #eee; min-height: 320px; }
  .sub-photo-icon-circle { width: 44px; height: 44px; border-radius: 50%; background: #eceaf7; display: flex; align-items: center; justify-content: center; color: #6a75c9; }
  .sub-photo-text { font-size: 14px; font-weight: 600; color: #444; }
  .sub-photo-hint { font-size: 11px; letter-spacing: 1px; color: #b5b3ae; }
  .sub-photo-img { display: block; width: 100%; height: 100%; object-fit: cover; position: absolute; inset: 0; }
  .sub-photo-change { position: relative; z-index: 1; margin-top: auto; font-size: 12px; font-weight: 600; color: white; background: rgba(0,0,0,0.55); padding: 6px 14px; border-radius: 999px; }

  .sub-preview-subtext { font-size: 16px; color: #8a8a8a; margin: 6px 0 0; text-align: center; }
  .sub-preview-section { border: 1px solid #ece9e4; border-radius: 14px; padding: 16px 18px; margin-bottom: 14px; }
  .sub-preview-section-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 0 0 10px; }
  .sub-preview-section-title { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 700; color: #2b2b2b; margin: 0; }
  .sub-preview-section-icon { flex-shrink: 0; width: 26px; height: 26px; border-radius: 50%; background: #f1effb; display: flex; align-items: center; justify-content: center; color: #5838b8; }
  .sub-preview-section-body { font-size: 16px; color: #666; line-height: 1.7; margin: 0; white-space: pre-wrap; }
  .sub-preview-question-text { font-size: 14px; font-weight: 700; color: #2b2b2b; margin: 0 0 10px; }
  .sub-preview-quote-box { border-radius: 10px; padding: 14px 16px; font-size: 16px; color: #555; line-height: 1.7; white-space: pre-wrap; }

  /* Mobile default: both buttons full width, one below the other — same
     pattern as StepBottomNav (WIZARD_EXTRA_STYLES). Desktop keeps the
     original 2-button side-by-side row, equal width (@container below). */
  /* column-reverse (not column) so the existing JSX order [back, send] —
     kept as-is to leave desktop's row layout/comment untouched — still puts
     the primary "send" button on top on mobile, back link below it. */
  .sub-preview-actions { display: flex; flex-direction: column-reverse; align-items: stretch; gap: 10px; padding-top: 4px; }
  .sub-preview-btn-send { width: 100%; padding: 13px 0; border-radius: 10px; border: none; background: #5838b8; color: white; font-size: 14px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
  /* Border darkened from #e6e4e0 to #c9c7c2 — the lighter tone read as
     barely-there next to the solid purple "send" button above it. */
  .sub-preview-btn-back { width: 100%; box-sizing: border-box; padding: 12px 20px; border-radius: 10px; border: 1px solid #c9c7c2; background: none; color: #5838b8; font-size: 14px; font-weight: 700; cursor: pointer; }
  .sub-preview-btn-send:disabled, .sub-preview-btn-back:disabled { opacity: 0.6; cursor: default; }

  @container (min-width: 860px) {
    .sub-preview-actions { flex-direction: row; gap: 10px; }
    /* Bug fix: .sub-preview-btn-send's mobile-default width:100% was never
       reset here, so at desktop it still tried to fill the whole row,
       squeezing .sub-preview-btn-back down to a tiny box next to it. */
    .sub-preview-btn-send { width: auto; flex: 1; }
    .sub-preview-btn-back { flex: 1; padding: 12px 0; border-radius: 10px; border: 1px solid #d8d6d1; color: #333; }
    .sub-preview-btn-send { background: #2f3f8f; }
    .sub-mobile-hero { display: none; }
    .sub-photo-drop { background: #fafaf9; }
    .sub-book-outer { padding: 22px 0; border-radius: 20px; }
    .sub-book {
      display: flex;
      flex-direction: row;
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
    .sub-page-form-scroll { flex: 1; min-height: 0; overflow-y: auto; margin: 4px -8px 0; padding: 0 8px 0; }
    .sub-page-form-bottom {
      position: static; left: auto; right: auto; bottom: auto; z-index: auto;
      background: none; max-width: none; margin: 0; box-shadow: none;
      flex-shrink: 0; padding: 16px 0 0;
    }
    .sub-page-form > .sub-actions { padding-bottom: 0; }
    .sub-preview-subtext { text-align: start; }
    .sub-page-photo { padding: 28px; background: white; display: flex; order: 0; }
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
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 13.5s-5.5-3.3-5.5-7.1C2.5 4.3 4 3 5.7 3c1 0 2 .5 2.3 1.3C8.3 3.5 9.3 3 10.3 3 12 3 13.5 4.3 13.5 6.4c0 3.8-5.5 7.1-5.5 7.1z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="3" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5.5 11v2.5L8.5 11" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function PhotoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="3.5" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="6" cy="7" r="1" fill="currentColor" />
      <path d="M3 11l3.2-3 2.3 2 2-2.3L14 11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M14 2 6.7 9.3M14 2 9.7 14l-3-4.7L2 6.3 14 2Z" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M11.3 2.3a1.5 1.5 0 0 1 2.1 2.1L5.5 12.3l-2.8.7.7-2.8 7.9-7.9Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Segmented step-progress bar — one pill per total step, filled up through
// the current one. Rendered inside each step's own .sub-page-form-top, right
// under its eyebrow (which already carries the "Step N of Total · Label"
// text) and above its heading — same position at every width, per the
// user's reference screenshots, replacing the earlier standalone bar that
// used to sit above the whole book.
export function StepProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="sub-progress-pills" aria-hidden>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={`sub-progress-pill${i < current ? " filled" : ""}`} />
      ))}
    </div>
  );
}

// The wave cut along a mobile hero photo's bottom edge — a single smooth
// S-curve, filled to match the page background, stretched (preserveAspectRatio
// "none") to whatever width the hero happens to render at.
function HeroWave() {
  return (
    <svg viewBox="0 0 200 40" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0,22 C35,42 65,2 100,18 C135,34 165,4 200,20 L200,40 L0,40 Z" fill="#fdfcfb" />
    </svg>
  );
}

// Full-bleed hero banner used ahead of the book on intro/preview/done
// (mobile only — see .sub-mobile-hero in BOOK_STYLES). Renders nothing when
// there's no image to show, rather than an empty banner.
export function MobileHero({ src }: { src: string | null | undefined }) {
  if (!src) return null;
  return (
    <div className="sub-mobile-hero">
      <img src={src} alt="" />
      <HeroWave />
    </div>
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
  photoUrl,
  photoFileName,
  onBackToEdit,
  onEdit,
  onConfirm,
  isSubmitting,
  confirmDisabled,
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
  // Only used by the "before sending" review cards (Step 5) — the guest's
  // own attached photo, shown as a small thumbnail in its own card rather
  // than the big side panel. Its filename, when known (fresh upload this
  // session), is shown alongside it; unknown (e.g. a photo already uploaded
  // in an earlier visit) simply omits that line.
  photoUrl?: string | null;
  photoFileName?: string | null;
  onBackToEdit: () => void;
  // Per-card "edit" links on the Step 5 review — jumps straight back to the
  // step that owns that card. Optional: omitted (e.g. the admin build page's
  // generic template preview) simply hides the links, since there's no real
  // wizard state to jump to there.
  onEdit?: (step: "blessing" | "answerQuestion" | "photo") => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  // True when there's nothing new to send (unedited since the last
  // successful submit) — disables the send button independently of
  // isSubmitting. Optional/no-op (defaults to enabled) for callers that
  // don't track this, e.g. the admin build page's generic template preview.
  confirmDisabled?: boolean;
  error: string | null;
  stepNumber: number;
  stepTotal: number;
  // True only for the admin build page's generic Step 5 template preview —
  // there's no real guest submission behind it, so every section shows
  // placeholder copy instead of the (empty) real answers/blessingText props.
  isAdminPreview?: boolean;
}) {
  const c = content[lang];
  const answeredQuestions = questions.filter((q) => (answers[q.id] ?? "").trim().length > 0);

  // The "before sending" question section: real answered question(s) for an
  // actual guest, or — in the admin's generic template preview, where
  // nothing's been answered yet — just the project's first configured
  // question, shown with placeholder body text.
  const questionSections = isAdminPreview
    ? questions.slice(0, 1).map((q) => ({ q, answerText: null as string | null }))
    : answeredQuestions.map((q) => ({ q, answerText: answers[q.id] }));

  const summary = (
    <div>
      <div className="sub-preview-section">
        <div className="sub-preview-section-head">
          <p className="sub-preview-section-title">
            <span className="sub-preview-section-icon">
              <HeartIcon />
            </span>
            {SECTION_BLESSING_LABEL[lang]}
          </p>
          {onEdit && (
            <button type="button" className="sub-preview-edit-link" onClick={() => onEdit("blessing")}>
              <PencilIcon />
              {EDIT_LABEL[lang]}
            </button>
          )}
        </div>
        <p className="sub-preview-section-body">
          {isAdminPreview ? ADMIN_PLACEHOLDER[lang] : blessingText?.trim() || ADMIN_PLACEHOLDER[lang]}
        </p>
      </div>

      {questionSections.map(({ q, answerText }) => (
        <div className="sub-preview-section" key={q.id}>
          <div className="sub-preview-section-head">
            <p className="sub-preview-section-title">
              <span className="sub-preview-section-icon">
                <ChatIcon />
              </span>
              {SECTION_QUESTION_LABEL[lang]}
            </p>
            {onEdit && (
              <button type="button" className="sub-preview-edit-link" onClick={() => onEdit("answerQuestion")}>
                <PencilIcon />
                {EDIT_LABEL[lang]}
              </button>
            )}
          </div>
          <p className="sub-preview-question-text">{questionText(q, lang)}</p>
          <div className="sub-preview-quote-box">{answerText ?? ADMIN_PLACEHOLDER[lang]}</div>
        </div>
      ))}

      {photoUrl && (
        <div className="sub-preview-section">
          <div className="sub-preview-section-head">
            <p className="sub-preview-section-title">
              <span className="sub-preview-section-icon">
                <PhotoIcon />
              </span>
              {SECTION_PHOTO_LABEL[lang]}
            </p>
            {onEdit && (
              <button type="button" className="sub-preview-edit-link" onClick={() => onEdit("photo")}>
                <PencilIcon />
                {EDIT_LABEL[lang]}
              </button>
            )}
          </div>
          <div className="sub-preview-photo-row">
            <img src={photoUrl} alt={SECTION_PHOTO_LABEL[lang]} className="sub-preview-photo-thumb" />
            {photoFileName && <span className="sub-preview-photo-name">{photoFileName}</span>}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="sub-page sub-page-form">
      <div className="sub-page-form-top">
        <p className="sub-eyebrow">
          {STEP_OF_LABEL[lang](stepNumber ?? 0, stepTotal ?? 0)} · {STEP_TITLE[lang]}
        </p>
        <StepProgress current={stepNumber ?? 0} total={stepTotal ?? 0} />
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
          <button
            type="button"
            className="sub-preview-btn-send"
            onClick={onConfirm}
            disabled={isSubmitting || confirmDisabled}
          >
            <SendIcon />
            {isSubmitting ? "..." : SEND_LABEL[lang]}
          </button>
        </div>
      </div>
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
      <MobileHero src={photoUrl} />
      <div className="sub-book">
        <BookTextPage {...pageProps} photoUrl={photoUrl} />
        <div className="sub-spine" />
        <PhotoPage photoUrl={photoUrl} />
      </div>
    </div>
  );
}
