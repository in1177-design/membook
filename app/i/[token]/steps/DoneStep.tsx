import type { Lang } from "../types";
import { STEP_OF_LABEL } from "../content";
import { PhotoPage, MobileHero, StepProgress } from "../SubmissionBook";

const SHORT_LABEL: Record<Lang, string> = { HE: "נשלח בהצלחה", RU: "Успешно отправлено", EN: "Successfully sent" };
const HEADING: Record<Lang, string> = { HE: "תודה רבה!", RU: "Большое спасибо!", EN: "Thank you so much!" };
const SUBTEXT: Record<Lang, string> = {
  HE: "הברכה, הסיפור והתמונה שלך התקבלו בהצלחה ויהפכו לחלק מאלבום הזיכרון המיוחד.",
  RU: "Ваше поздравление, история и фотография успешно получены и станут частью особого альбома памяти.",
  EN: "Your blessing, story, and photo were received successfully and will become part of the special memory album.",
};
const CLOSE_NOTE: Record<Lang, string> = {
  HE: "אפשר לסגור את החלון הזה עכשיו.",
  RU: "Теперь это окно можно закрыть.",
  EN: "You can close this window now.",
};
const BACK_LABEL: Record<Lang, string> = {
  HE: "חזרה לעריכה",
  RU: "Вернуться к редактированию",
  EN: "Back to editing",
};

function CheckCircleIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
      <circle cx="17" cy="17" r="16" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10.5 17.5l4 4 9-9.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// The text side only (no photo panel) — same split used by every other step
// so far (PhotoStepForm/PhotoDropPanel, BookTextPage/PhotoPage): the admin
// build page pairs this with its own trailing photo panel directly, and the
// default export below pairs it with one for the real guest wizard. Content
// is fixed, non-editable copy (like Step 5's headings) — there's nothing
// guest- or project-specific to show on a "your submission was received"
// screen, so unlike earlier steps this has no admin-editable fields at all.
export function DoneStepForm({
  lang,
  stepNumber,
  stepTotal,
  onBackToEdit,
}: {
  lang: Lang;
  stepNumber: number;
  stepTotal: number;
  // Present only for the real guest flow — lets them go back and change
  // something even after a successful send. Omitted in the admin build
  // page's generic preview, where there's nothing real to go back to.
  onBackToEdit?: () => void;
}) {
  return (
    <div className="sub-page sub-page-form" dir={lang === "HE" ? "rtl" : "ltr"}>
      <div className="sub-page-form-top">
        <p className="sub-eyebrow">
          {STEP_OF_LABEL[lang](stepNumber, stepTotal)} · {SHORT_LABEL[lang]}
        </p>
        <StepProgress current={stepNumber} total={stepTotal} />
      </div>

      <div className="sub-page-form-scroll">
        <div className="sub-done-wrap">
          <span className="sub-done-icon-circle">
            <CheckCircleIcon />
          </span>
          <h1 className="sub-done-heading">{HEADING[lang]}</h1>
          <p className="sub-done-subtext">{SUBTEXT[lang]}</p>
          <p className="sub-done-note">{CLOSE_NOTE[lang]}</p>
        </div>
      </div>

      {onBackToEdit && (
        <div className="sub-page-form-bottom" style={{ textAlign: "center" }}>
          <button type="button" className="sub-step-back" style={{ margin: "0 auto" }} onClick={onBackToEdit}>
            {BACK_LABEL[lang]}
          </button>
        </div>
      )}
    </div>
  );
}

// Full 2-page spread (text + photo) for the real guest flow, standalone —
// same pattern as SubmissionBook's default export. Shows the photo the guest
// actually attached, same as every other step's photo panel.
export default function DoneStep(props: Parameters<typeof DoneStepForm>[0] & { photoUrl: string | null }) {
  const { photoUrl, ...formProps } = props;
  return (
    <div className="sub-book-outer">
      <MobileHero src={photoUrl} />
      <div className="sub-book">
        <DoneStepForm {...formProps} />
        <div className="sub-spine" />
        <PhotoPage photoUrl={photoUrl} className="sub-page-photo-hide-mobile" />
      </div>
    </div>
  );
}
