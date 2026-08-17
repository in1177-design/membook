import { useRef, useState, type ReactNode } from "react";
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
  HE: "זה התוכן שיופיע בעמוד שלכם באלבום",
  RU: "Это содержимое, которое появится на вашей странице в альбоме.",
  EN: "This is the content that will appear on your page in the album.",
};
const PREVIEW_SUBTEXT: Record<Lang, string> = {
  HE: "עברו על הפרטים וודאו שהכל נראה כמו שרציתם.",
  RU: "Просмотрите детали и убедитесь, что всё выглядит так, как вы хотели.",
  EN: "Go over the details and make sure everything looks the way you wanted.",
};
// Copy for a returning guest who already completed their submission
// (isSubmittedView) — replaces PREVIEW_HEADING/PREVIEW_SUBTEXT above, and the
// step-of-total eyebrow/progress bar are hidden entirely, since there's no
// "step" to be on anymore and nothing left to send.
const SUBMITTED_HEADING: Record<Lang, string> = {
  HE: "הברכה שלכם כבר נשלחה",
  RU: "Ваше поздравление уже отправлено",
  EN: "Your message has already been submitted",
};
// \n renders as a real line break — see .sub-preview-subtext's white-space.
const SUBMITTED_SUBTEXT: Record<Lang, string> = {
  HE: "זה התוכן ששלחתם לאלבום.\nאפשר עדיין לערוך את הברכה, לשנות את התשובה, להחליף או להוסיף תמונה — ולשלוח שוב את הגרסה המעודכנת.",
  RU: "Это содержимое, которое вы отправили для альбома.\nВы всё ещё можете отредактировать поздравление, изменить ответ, заменить или добавить фотографию и снова отправить обновлённую версию.",
  EN: "This is the content you submitted to the album.\nYou can still edit your message, change your answer, replace or add a photo, and submit the updated version again.",
};
const SEND_LABEL: Record<Lang, string> = { HE: "שליחה", RU: "Отправить", EN: "Send" };
const SECTION_BLESSING_LABEL: Record<Lang, string> = { HE: "הברכה שלכם", RU: "Ваше пожелание", EN: "Your blessing" };
const EDIT_LABEL: Record<Lang, string> = { HE: "עריכה", RU: "Изменить", EN: "Edit" };
// Admin-only (AlbumPageView) copy — the "signed by" byline under the
// blessing, and the "add a missing answer" affordance for a submission that
// only ever had a blessing (a real, valid guest state — the final-submit
// guard in app/api/submissions/route.ts accepts blessing-only content).
const SIGNED_BY_LABEL: Record<Lang, string> = { HE: "מאת", RU: "От", EN: "From" };
// Explicit save, next to every editable field — blur still saves too where
// it reliably fires, but closing the modal via Escape doesn't always give a
// textarea time to blur first, so this is the one guaranteed way to commit
// an edit before leaving the section.
const SAVE_LABEL: Record<Lang, string> = { HE: "שמור", RU: "Сохранить", EN: "Save" };
// Admin-only (AlbumPageView) — copy-to-clipboard next to every "עריכה" pencil,
// so the admin can grab a section's text (e.g. to paste into design software)
// without switching into edit mode first.
const COPY_LABEL: Record<Lang, string> = { HE: "העתקה", RU: "Копировать", EN: "Copy" };
const COPIED_LABEL: Record<Lang, string> = { HE: "הועתק", RU: "Скопировано", EN: "Copied" };
const ADD_ADDITIONAL_TEXT_LABEL: Record<Lang, string> = {
  HE: "+ הוספת מידע נוסף",
  RU: "+ Добавить дополнительную информацию",
  EN: "+ Add additional info",
};
const ADDITIONAL_TEXT_LABEL: Record<Lang, string> = { HE: "מידע נוסף", RU: "Дополнительно", EN: "Additional info" };
// Same copy as Step 4's own "add photo" button (PhotoStep.tsx's
// ADD_PHOTO_LABEL) — duplicated locally rather than imported, matching this
// file's existing pattern of each step owning its own small icon/label set.
const ADD_PHOTO_LABEL: Record<Lang, string> = { HE: "הוספת תמונה", RU: "Добавить фотографию", EN: "Add photo" };
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
     the book on the 3 steps that have one: intro, preview, done). */
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

  /* Admin-preview-only "התאם תמונה" control on the intro hero (see
     AdjustableCoverHero.tsx) — never rendered for real guests. */
  .sub-cover-fit-draglayer { position: absolute; inset: 0; z-index: 1; cursor: grab; touch-action: none; }
  .sub-cover-fit-draglayer:active { cursor: grabbing; }
  .sub-cover-fit-btn {
    position: absolute; top: 12px; inset-inline-end: 12px; z-index: 2;
    display: inline-flex; align-items: center; gap: 6px;
    padding: 7px 12px; border-radius: 999px; border: none;
    background: rgba(0,0,0,0.55); color: white; font-size: 12px; font-weight: 700; cursor: pointer;
  }
  .sub-cover-fit-btn[aria-pressed="true"] { background: #5838b8; }
  .sub-cover-fit-status {
    position: absolute; bottom: 46px; inset-inline-end: 12px; z-index: 2;
    padding: 4px 10px; border-radius: 999px; background: rgba(0,0,0,0.55); color: white; font-size: 11px;
  }

  /* Step 5's main photo (mobile hero banner / desktop side panel) — an
     overlay "edit" pill that reuses the exact same edit action as the
     blessing/question cards below it (onEdit("photo"), jumping back to the
     Photo step) instead of the old separate "התמונה שלכם" review card. Sets
     its own dir (rather than relying on an ancestor) since it's rendered
     inside MobileHero/PhotoPage, which sit outside BookTextPage's own
     directional wrapper — inset-inline-end then resolves to the left in
     Hebrew (rtl) and the right in Russian/English (ltr). */
  .sub-preview-photo-edit-btn {
    position: absolute; top: 12px; inset-inline-end: 12px; z-index: 2;
    display: inline-flex; align-items: center; gap: 6px;
    padding: 7px 12px; border-radius: 999px; border: none;
    background: rgba(0,0,0,0.55); color: white; font-size: 12px; font-weight: 700; cursor: pointer;
  }
  /* Step 5 review card per-card edit link. */
  .sub-preview-edit-link {
    display: inline-flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 700;
    color: #5838b8; background: none; border: none; padding: 0; cursor: pointer;
  }
  /* Admin-only copy-to-clipboard, sitting right next to .sub-preview-edit-link
     (same row, same size) — muted gray rather than the edit link's purple so
     the pencil (the primary action) still reads as more prominent. */
  .sub-preview-copy-link {
    display: inline-flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 700;
    color: #999; background: none; border: none; padding: 0; cursor: pointer;
  }
  .sub-preview-copy-link.is-copied { color: #0f9d58; }
  .sub-preview-section-head-actions { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }

  .sub-divider { border: none; border-top: 1px solid #e8e6e2; margin: 0 0 20px; }
  .sub-field-label { display: block; font-size: 11px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; color: #9a9a9a; margin-bottom: 8px; }

  .sub-photo-drop { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; min-height: 260px; cursor: pointer; border-radius: 14px; border: 1.5px dashed #d8d6d1; background: #f5f3ff; text-align: center; overflow: hidden; }
  .sub-photo-drop.has-photo { cursor: default; border-style: solid; border-color: #e6e4e0; background: #eee; min-height: 320px; }
  .sub-photo-icon-circle { width: 44px; height: 44px; border-radius: 50%; background: #eceaf7; display: flex; align-items: center; justify-content: center; color: #6a75c9; }
  .sub-photo-text { font-size: 14px; font-weight: 600; color: #444; }
  .sub-photo-hint { font-size: 11px; letter-spacing: 1px; color: #b5b3ae; }
  .sub-photo-img { display: block; width: 100%; height: 100%; object-fit: cover; position: absolute; inset: 0; }
  .sub-photo-change { position: relative; z-index: 1; margin-top: auto; font-size: 12px; font-weight: 600; color: white; background: rgba(0,0,0,0.55); padding: 6px 14px; border-radius: 999px; }

  /* pre-line so SUBMITTED_SUBTEXT's embedded \n renders as a real line break
     (the plain "before sending" subtext has none, so this is a no-op there). */
  .sub-preview-subtext { font-size: 16px; color: #8a8a8a; margin: 6px 0 0; text-align: center; white-space: pre-line; }
  .sub-preview-section { border: 1px solid #ece9e4; border-radius: 14px; padding: 16px 18px; margin-bottom: 14px; }
  .sub-preview-section-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 0 0 10px; }
  .sub-preview-section-title { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 700; color: #2b2b2b; margin: 0; overflow-wrap: break-word; word-break: break-word; min-width: 0; }
  .sub-preview-section-icon { flex-shrink: 0; width: 26px; height: 26px; border-radius: 50%; background: #f1effb; display: flex; align-items: center; justify-content: center; color: #5838b8; }
  /* Same look for both — the blessing's body text and the Q&A's answer text
     are both just "the guest's own words" inside an already-bordered
     .sub-preview-section card, so neither gets its own extra padding/box
     (a nested padded quote-box read as too far from the card's edge, out of
     step with the blessing text sitting flush against it). */
  .sub-preview-section-body,
  .sub-preview-quote-box {
    font-size: 16px; color: #666; line-height: 1.7; margin: 0; white-space: pre-wrap;
    overflow-wrap: break-word; word-break: break-word;
  }

  /* Admin-only (AlbumPageView) inline editing — same "you're editing this"
     yellow highlight as .sub-photo-subtext-editable (SubmissionWizard.tsx),
     reused here so both editable-text treatments in the app look the same. */
  .sub-preview-editable-textarea {
    width: 100%; resize: vertical; box-sizing: border-box; font-family: inherit;
    font-size: 16px; color: #444; line-height: 1.7; overflow-wrap: break-word; word-break: break-word;
    border: 1px solid #f0c419; background: #fdf6d8; border-radius: 8px; padding: 8px 10px;
  }
  .sub-preview-editable-textarea:focus { outline: 2px solid #f0c419; }
  .sub-preview-save-btn {
    display: block; margin-top: 8px; padding: 7px 18px; border-radius: 8px; border: none;
    background: #5838b8; color: white; font-size: 13px; font-weight: 700; cursor: pointer;
  }
  .sub-preview-add-question-btn {
    display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; box-sizing: border-box;
    font-size: 13px; font-weight: 700; color: #5838b8; background: none; border: 1px dashed #c9c2ec;
    border-radius: 10px; padding: 12px 14px; cursor: pointer;
  }
  /* "מאת" footer bar, sitting below every card (not nested inside the
     blessing card) — matches the design sketch's light strip under both
     cards rather than a byline glued to the blessing text. */
  .sub-preview-signed-by-bar {
    margin-top: 4px; padding: 12px 16px; border-radius: 10px; background: #f7f6f4; font-size: 13px; color: #666;
    overflow-wrap: break-word; word-break: break-word;
    display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
  }
  .sub-preview-signed-by-bar input {
    font-size: 13px; color: #444; width: 220px; max-width: 100%; margin-inline-start: 6px;
    border: 1px solid #f0c419; background: #fdf6d8; border-radius: 8px; padding: 4px 8px; box-sizing: border-box; font-family: inherit;
  }

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

export function PhotoPage({
  photoUrl,
  overlay,
  emptyState,
  onEmptyStateClick,
}: {
  photoUrl: string | null;
  // Step 5's "edit photo" pill (see .sub-preview-photo-edit-btn) — optional
  // so every other caller of this shared component (steps 2-4's trailing
  // photo panel, the admin build page) is unaffected.
  overlay?: ReactNode;
  // Step 5's desktop "no own photo yet" state — replaces the normal
  // image+overlay with Step 4's own empty-state look (dimmed backdrop + big
  // "add photo" circle, see SubmissionBook's showAddPhotoState) instead of
  // stacking a small overlay pill on top of it.
  emptyState?: ReactNode;
  onEmptyStateClick?: () => void;
}) {
  return (
    <div className="sub-page sub-page-photo">
      <div
        className={`sub-photo-drop${photoUrl && !emptyState ? " has-photo" : ""}`}
        onClick={emptyState ? onEmptyStateClick : undefined}
        style={emptyState ? { cursor: "pointer" } : undefined}
      >
        {emptyState ?? (photoUrl && <img src={photoUrl} alt="" className="sub-photo-img" />)}
        {!emptyState && overlay}
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

function SendIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M14 2 6.7 9.3M14 2 9.7 14l-3-4.7L2 6.3 14 2Z" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Same glyph as Step 4's own PhotoAddIcon (PhotoStep.tsx) — duplicated
// locally (see ADD_PHOTO_LABEL above) with a size param so the one shape
// covers both this file's small overlay pill (12px, matching PencilIcon)
// and the big desktop empty-state circle (26px, matching .sub-photo-add-circle).
function PhotoAddIcon({ size = 26 }: { size?: number } = {}) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" fill="none" aria-hidden="true">
      <rect x="2" y="4" width="22" height="17" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="9" cy="10" r="1.6" fill="currentColor" />
      <path d="M3.5 18 9 12.5l3.5 3.5 3.5-4L22.5 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
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

function CopyIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="5.5" y="5.5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M3 10.5V3a1 1 0 0 1 1-1h7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

// Admin-only (see COPY_LABEL above) — sits next to every "עריכה" pencil in
// this file, always copying the section's live text regardless of whether
// that section happens to be in edit mode right now.
function CopyButton({ text, lang }: { text: string; lang: Lang }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={`sub-preview-copy-link${copied ? " is-copied" : ""}`}
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        });
      }}
    >
      <CopyIcon />
      {copied ? COPIED_LABEL[lang] : COPY_LABEL[lang]}
    </button>
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
// "none") to whatever width the hero happens to render at. Exported so
// AdjustableCoverHero (the admin preview's draggable cover-photo control)
// can reuse the exact same shape instead of duplicating it.
export function HeroWave() {
  return (
    <svg viewBox="0 0 200 40" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0,22 C35,42 65,2 100,18 C135,34 165,4 200,20 L200,40 L0,40 Z" fill="#fdfcfb" />
    </svg>
  );
}

// Full-bleed hero banner used ahead of the book on intro/preview/done
// (mobile only — see .sub-mobile-hero in BOOK_STYLES). Renders nothing when
// there's no image to show, rather than an empty banner. `positionY` (0-100,
// object-position's Y%) defaults to centered — only ever non-50 for the
// intro step's project cover photo, set via AdjustableCoverHero's "התאם
// תמונה" control on the admin preview page. `overlay` lets that same admin
// control render its drag layer/button on top of this exact markup instead
// of duplicating it.
export function MobileHero({
  src,
  positionY = 50,
  overlay,
}: {
  src: string | null | undefined;
  positionY?: number;
  overlay?: ReactNode;
}) {
  if (!src) return null;
  return (
    <div className="sub-mobile-hero">
      <img src={src} alt="" style={{ objectPosition: `50% ${positionY}%` }} />
      <HeroWave />
      {overlay}
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
  onBackToEdit,
  onEdit,
  onConfirm,
  isSubmitting,
  confirmDisabled,
  error,
  stepNumber,
  stepTotal,
  isAdminPreview,
  isSubmittedView,
  editableBlessing,
  editableSignedBy,
  editableAnswers,
  editableAdditionalText,
  pageCaption,
}: {
  content: Record<Lang, LangContent>;
  lang: Lang;
  answers: Record<string, string>;
  questions: Question[];
  dateLocation: string;
  blessingText?: string | null;
  blessingSignedBy?: string | null;
  onBackToEdit: () => void;
  // Per-card "edit" links on the Step 5 review — jumps straight back to the
  // step that owns that card. Optional: omitted (e.g. the admin build page's
  // generic template preview) simply hides the links, since there's no real
  // wizard state to jump to there. Ignored (not called) when the matching
  // editableBlessing/editableAnswers prop below is present — see there.
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
  // True for a returning guest whose submission is already completed AND
  // unedited since (see SubmissionWizard's isCompleted && !hasChanges) — see
  // SUBMITTED_HEADING/SUBTEXT above. Swaps the top copy, hides the step
  // eyebrow/progress bar/send button; the per-card edit links (onEdit) still
  // work exactly the same either way, and editing anything flips this back
  // to false so the send button reappears.
  isSubmittedView?: boolean;
  // Admin-only (AlbumPageView) inline editing — additive, the real guest
  // wizard never passes these, so its onEdit (step-navigation) behavior is
  // unaffected. When present, the "עריכה" pencil turns that section's own
  // text into a controlled <textarea> in place (no navigation) instead of
  // calling onEdit. See PhotoStepForm's identical isEditable pattern
  // (app/i/[token]/steps/PhotoStep.tsx) — same idea, applied here.
  editableBlessing?: { value: string; onChange: (v: string) => void; onBlur: () => void };
  editableSignedBy?: { value: string; onChange: (v: string) => void; onBlur: () => void };
  editableAnswers?: Record<string, { value: string; onChange: (v: string) => void; onBlur: () => void }>;
  // A submission can legitimately have only a blessing and no answered
  // question at all (see app/api/submissions/route.ts's final-submit guard —
  // blessing text alone satisfies it). Not tied to any of the project's
  // configured questions — a separate free-text block the admin can add.
  editableAdditionalText?: { value: string; onChange: (v: string) => void; onBlur: () => void };
  // Admin-only (AlbumPageView) — a caption rendered directly above the blessing
  // card with eyebrow label and description text. Optional, passed only when
  // this component is used in admin context (not for real guests).
  pageCaption?: { label: string; description: string };
}) {
  const c = content[lang];
  const answeredQuestions = questions.filter((q) => (answers[q.id] ?? "").trim().length > 0);
  const isAdminEditable = Boolean(editableAnswers);

  // Which section (if any) is currently showing its <textarea> instead of
  // read-only text — "blessing", a questionId, "additional", or null. Only
  // ever set via the editable* props' pencils below; the real guest wizard
  // (no editable* props passed) never touches this. Reverts to read-only text
  // as soon as the admin clicks/tabs away — the yellow "editing" box used to
  // just stay open indefinitely with no visual confirmation anything saved.
  const [editingSection, setEditingSection] = useState<string | null>(null);

  // Blessing text + "מאת" live in two separate cards (see the signed-by
  // footer bar below) but are one logical edit group, saved together — a
  // plain onBlur on either control would close the group the instant the
  // admin tabs from one into the other. Deferring the check to the next tick
  // (by which point the browser has already moved focus) lets us tell "left
  // the group" apart from "moved within it".
  const blessingTextareaRef = useRef<HTMLTextAreaElement>(null);
  const signedByInputRef = useRef<HTMLInputElement>(null);
  function handleBlessingGroupBlur() {
    window.setTimeout(() => {
      const active = document.activeElement;
      if (active !== blessingTextareaRef.current && active !== signedByInputRef.current) {
        // Functional update, not a bare setEditingSection(null): if the admin
        // clicked straight from here into a *different* section's "עריכה"
        // pencil, that click's own onClick already ran (and set editingSection
        // to the new section) before this deferred check fires — only clear
        // if we're still actually in "blessing" by the time this runs.
        setEditingSection((prev) => (prev === "blessing" ? null : prev));
      }
    }, 0);
  }

  // Explicit "שמור" click — the guaranteed save path (blur-based saving
  // doesn't always get a chance to fire, e.g. closing the modal via Escape).
  // Blessing text + signed-by save together via the same action either way,
  // so calling editableBlessing.onBlur() alone covers both.
  function commitBlessingEdit() {
    editableBlessing?.onBlur();
    setEditingSection(null);
  }

  // Same shared "blessing" edit group as the blessing textarea (see above),
  // but entered from the signed-by bar's own pencil — the textarea still
  // gets the group's default autoFocus, so this steals it back to the
  // signed-by input once it's actually mounted, matching what the admin
  // just clicked on.
  function editSignedBy() {
    setEditingSection("blessing");
    window.setTimeout(() => signedByInputRef.current?.focus(), 0);
  }

  // The "before sending" question section: real answered question(s) for an
  // actual guest, or the admin's generic template preview's single
  // placeholder question. Admin edit mode (AlbumPageView) shows exactly the
  // same answered questions — adding content unrelated to a configured
  // question goes through editableAdditionalText below instead.
  const questionSections = isAdminPreview
    ? questions.slice(0, 1).map((q) => ({ q, answerText: null as string | null }))
    : answeredQuestions.map((q) => ({ q, answerText: answers[q.id] }));

  const summary = (
    <div>
      {pageCaption && (
        <>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "#999", margin: "0 0 4px" }}>
            {pageCaption.label}
          </p>
          <p style={{ fontSize: 12, color: "#bbb", margin: "0 0 16px" }}>{pageCaption.description}</p>
        </>
      )}
      <div className="sub-preview-section">
        <div className="sub-preview-section-head">
          <p className="sub-preview-section-title">
            <span className="sub-preview-section-icon">
              <HeartIcon />
            </span>
            {SECTION_BLESSING_LABEL[lang]}
          </p>
          {editableBlessing ? (
            <div className="sub-preview-section-head-actions">
              <CopyButton text={editableBlessing.value} lang={lang} />
              {editingSection !== "blessing" && (
                <button type="button" className="sub-preview-edit-link" onClick={() => setEditingSection("blessing")}>
                  <PencilIcon />
                  {EDIT_LABEL[lang]}
                </button>
              )}
            </div>
          ) : (
            onEdit && (
              <button type="button" className="sub-preview-edit-link" onClick={() => onEdit("blessing")}>
                <PencilIcon />
                {EDIT_LABEL[lang]}
              </button>
            )
          )}
        </div>
        {editableBlessing && editingSection === "blessing" ? (
          <>
            <textarea
              ref={blessingTextareaRef}
              className="sub-preview-editable-textarea"
              rows={3}
              value={editableBlessing.value}
              onChange={(e) => editableBlessing.onChange(e.target.value)}
              onBlur={() => {
                editableBlessing.onBlur();
                handleBlessingGroupBlur();
              }}
              autoFocus
            />
            <button type="button" className="sub-preview-save-btn" onClick={commitBlessingEdit}>
              {SAVE_LABEL[lang]}
            </button>
          </>
        ) : (
          <p className="sub-preview-section-body">
            {isAdminPreview ? ADMIN_PLACEHOLDER[lang] : blessingText?.trim() || ADMIN_PLACEHOLDER[lang]}
          </p>
        )}
      </div>

      {questionSections.map(({ q, answerText }) => {
        const editableAnswer = editableAnswers?.[q.id];
        const isEditingThis = editingSection === q.id;
        return (
          <div className="sub-preview-section" key={q.id}>
            <div className="sub-preview-section-head">
              {/* The generic "השאלה והתשובה" label is gone — the actual
                  question now doubles as this card's title, same slot/style
                  the blessing card's label sits in above. */}
              <p className="sub-preview-section-title">
                <span className="sub-preview-section-icon">
                  <ChatIcon />
                </span>
                {questionText(q, lang)}
              </p>
              {editableAnswer ? (
                <div className="sub-preview-section-head-actions">
                  <CopyButton text={editableAnswer.value} lang={lang} />
                  {!isEditingThis && (
                    <button type="button" className="sub-preview-edit-link" onClick={() => setEditingSection(q.id)}>
                      <PencilIcon />
                      {EDIT_LABEL[lang]}
                    </button>
                  )}
                </div>
              ) : (
                onEdit && (
                  <button type="button" className="sub-preview-edit-link" onClick={() => onEdit("answerQuestion")}>
                    <PencilIcon />
                    {EDIT_LABEL[lang]}
                  </button>
                )
              )}
            </div>
            {editableAnswer && isEditingThis ? (
              <>
                <textarea
                  className="sub-preview-editable-textarea"
                  rows={3}
                  value={editableAnswer.value}
                  onChange={(e) => editableAnswer.onChange(e.target.value)}
                  onBlur={() => {
                    editableAnswer.onBlur();
                    setEditingSection(null);
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  className="sub-preview-save-btn"
                  onClick={() => {
                    editableAnswer.onBlur();
                    setEditingSection(null);
                  }}
                >
                  {SAVE_LABEL[lang]}
                </button>
              </>
            ) : (
              <div className="sub-preview-quote-box">{answerText ?? ADMIN_PLACEHOLDER[lang]}</div>
            )}
          </div>
        );
      })}

      {/* Admin-only free-text block, unrelated to any configured question —
          shown as its own card once it has content (or while being added),
          otherwise just the "+" button below. */}
      {editableAdditionalText && (editableAdditionalText.value || editingSection === "additional") ? (
        <div className="sub-preview-section">
          <div className="sub-preview-section-head">
            <p className="sub-preview-section-title">
              <span className="sub-preview-section-icon">
                <ChatIcon />
              </span>
              {ADDITIONAL_TEXT_LABEL[lang]}
            </p>
            <div className="sub-preview-section-head-actions">
              <CopyButton text={editableAdditionalText.value} lang={lang} />
              {editingSection !== "additional" && (
                <button type="button" className="sub-preview-edit-link" onClick={() => setEditingSection("additional")}>
                  <PencilIcon />
                  {EDIT_LABEL[lang]}
                </button>
              )}
            </div>
          </div>
          {editingSection === "additional" ? (
            <>
              <textarea
                className="sub-preview-editable-textarea"
                rows={3}
                value={editableAdditionalText.value}
                onChange={(e) => editableAdditionalText.onChange(e.target.value)}
                onBlur={() => {
                  editableAdditionalText.onBlur();
                  setEditingSection(null);
                }}
                autoFocus
              />
              <button
                type="button"
                className="sub-preview-save-btn"
                onClick={() => {
                  editableAdditionalText.onBlur();
                  setEditingSection(null);
                }}
              >
                {SAVE_LABEL[lang]}
              </button>
            </>
          ) : (
            <div className="sub-preview-quote-box">{editableAdditionalText.value}</div>
          )}
        </div>
      ) : (
        editableAdditionalText && (
          <button type="button" className="sub-preview-add-question-btn" onClick={() => setEditingSection("additional")}>
            {ADD_ADDITIONAL_TEXT_LABEL[lang]}
          </button>
        )
      )}

      {/* "מאת" — admin-only, shown as its own footer bar below every card
          (not glued to the blessing text), toggled by the same blessing edit
          state since it's saved together via the same action. Its own
          עריכה/copy actions here just trigger that same shared state — this
          bar used to only become editable as a side effect of the blessing
          card's own pencil, with no visible affordance of its own. */}
      {editableSignedBy && (
        <div className="sub-preview-signed-by-bar">
          <span>
            {SIGNED_BY_LABEL[lang]}:
            {editingSection === "blessing" ? (
              <input
                ref={signedByInputRef}
                value={editableSignedBy.value}
                onChange={(e) => editableSignedBy.onChange(e.target.value)}
                onBlur={() => {
                  editableSignedBy.onBlur();
                  handleBlessingGroupBlur();
                }}
              />
            ) : (
              <> {editableSignedBy.value}</>
            )}
          </span>
          <div className="sub-preview-section-head-actions">
            <CopyButton text={editableSignedBy.value} lang={lang} />
            {editingSection !== "blessing" && (
              <button type="button" className="sub-preview-edit-link" onClick={editSignedBy}>
                <PencilIcon />
                {EDIT_LABEL[lang]}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    // Every other step sets dir on its own root this same way (see e.g.
    // BlessingStep.tsx) — Step 5 was missing it, so RU/EN guests were
    // silently getting the global <html dir="rtl"> default instead of their
    // own language's direction for the section text/edit-button placement.
    <div className="sub-page sub-page-form" dir={lang === "HE" ? "rtl" : "ltr"}>
      <div className="sub-page-form-top">
        {/* A returning, already-submitted guest isn't "on a step" anymore
            (they can reopen this screen indefinitely, edit-only) — no step
            eyebrow, no progress bar, just the "already sent" message. */}
        {!isSubmittedView && (
          <>
            <p className="sub-eyebrow">
              {STEP_OF_LABEL[lang](stepNumber ?? 0, stepTotal ?? 0)} · {STEP_TITLE[lang]}
            </p>
            <StepProgress current={stepNumber ?? 0} total={stepTotal ?? 0} />
          </>
        )}
        {/* AlbumPageView supplies its own plain "תצוגת דף אלבום" caption above
            this whole component instead — the guest-facing "already sent"
            heading/subtext would be redundant (and inaccurate, e.g. for an
            invitee who hasn't actually sent anything yet) inside the admin's
            own preview modal. */}
        {!isAdminEditable && (
          <>
            <h1 className="sub-heading">{isSubmittedView ? SUBMITTED_HEADING[lang] : PREVIEW_HEADING[lang]}</h1>
            <p className="sub-preview-subtext">{isSubmittedView ? SUBMITTED_SUBTEXT[lang] : PREVIEW_SUBTEXT[lang]}</p>
          </>
        )}
      </div>
      <div className="sub-page-form-scroll">{summary}</div>
      {/* Same reasoning: "back to editing" only makes sense mid-wizard, for a
          real guest — AlbumPageView's modal has its own X close button
          (Modal.tsx), so this whole bar (and the send button, already hidden
          via isSubmittedView) is skipped entirely in admin edit mode. */}
      {!isAdminEditable && (
        <div className="sub-page-form-bottom">
          {error && <p style={{ color: "#b00020", marginBottom: 10, fontSize: 13 }}>{error}</p>}
          <div className="sub-preview-actions">
            <button type="button" className="sub-preview-btn-back" onClick={onBackToEdit} disabled={isSubmitting}>
              {c.backToEditLabel}
            </button>
            {/* Already sent with nothing changed since — nothing to submit, so
                this stays hidden. Editing anything (via the per-card edit
                links above or "back to editing" on the left) flips
                isSubmittedView back to false once the guest returns here,
                which brings this button right back so they can send the
                updated version. */}
            {!isSubmittedView && (
              <button
                type="button"
                className="sub-preview-btn-send"
                onClick={onConfirm}
                disabled={isSubmitting || confirmDisabled}
              >
                <SendIcon />
                {isSubmitting ? "..." : SEND_LABEL[lang]}
              </button>
            )}
          </div>
        </div>
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
  props: Parameters<typeof BookTextPage>[0] & {
    photoUrl: string | null;
    // False when photoUrl is only the project's cover-photo fallback (the
    // guest hasn't uploaded their own yet) — swaps the "עריכה" pill for an
    // "הוספת תמונה" one, and swaps the desktop side panel for Step 4's own
    // empty-state look. Defaults true (today's only behavior) so this stays
    // a no-op for the one caller (PreviewStep) until it starts passing it.
    hasOwnPhoto?: boolean;
  }
) {
  const { photoUrl, lang, onEdit, hasOwnPhoto = true, ...pageProps } = props;
  // Step 5's photo-panel overlay, shown on the main photo itself (mobile
  // hero banner / desktop side panel) — reuses the exact same onEdit("photo")
  // behavior as every other card's edit link, so there's no separate edit
  // flow to maintain. Rendered in both places from one spot here (rather
  // than inside MobileHero/PhotoPage themselves) since it's Step-5-specific,
  // not something those two shared components should know about on their
  // own. Sets its own dir — see .sub-preview-photo-edit-btn.
  const photoEditOverlay = onEdit ? (
    <button
      type="button"
      dir={lang === "HE" ? "rtl" : "ltr"}
      className="sub-preview-photo-edit-btn"
      onClick={() => onEdit("photo")}
    >
      {hasOwnPhoto ? <PencilIcon /> : <PhotoAddIcon size={12} />}
      {hasOwnPhoto ? EDIT_LABEL[lang] : ADD_PHOTO_LABEL[lang]}
    </button>
  ) : undefined;
  // Desktop-only: no own photo yet, so the side panel shows Step 4's own
  // empty-state look (PhotoDropPanel in PhotoStep.tsx) — a dimmed cover-photo
  // backdrop with a big "add photo" circle — instead of stacking the small
  // pill above on top of the full-opacity fallback image. Mobile keeps the
  // small pill (photoEditOverlay) either way; there's no separate "big"
  // mobile treatment.
  const desktopAddPhotoState =
    onEdit && !hasOwnPhoto ? (
      <>
        {photoUrl && <img src={photoUrl} alt="" className="sub-photo-drop-backdrop" />}
        <span className="sub-photo-add-circle">
          <span className="sub-photo-add-icon">
            <PhotoAddIcon />
            <span className="sub-photo-add-badge">+</span>
          </span>
          <span className="sub-photo-add-label">{ADD_PHOTO_LABEL[lang]}</span>
        </span>
      </>
    ) : undefined;
  return (
    <div className="sub-book-outer">
      <MobileHero src={photoUrl} overlay={photoEditOverlay} />
      <div className="sub-book">
        <BookTextPage {...pageProps} lang={lang} onEdit={onEdit} />
        <div className="sub-spine" />
        <PhotoPage
          photoUrl={photoUrl}
          overlay={photoEditOverlay}
          emptyState={desktopAddPhotoState}
          onEmptyStateClick={desktopAddPhotoState ? () => onEdit!("photo") : undefined}
        />
      </div>
    </div>
  );
}
