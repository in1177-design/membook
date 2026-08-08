import { useRef } from "react";
import type { Lang } from "../types";
import { STEP_OF_LABEL } from "../content";
import StepBottomNav from "./StepBottomNav";

const SHORT_LABEL: Record<Lang, string> = { HE: "התמונה", RU: "Фотография", EN: "Photo" };
const STEP_TITLE: Record<Lang, string> = {
  HE: "עכשיו מוסיפים תמונה",
  RU: "Теперь добавим фотографию",
  EN: "Now add a photo",
};
const HINT_LINE_1: Record<Lang, string> = {
  HE: "אפשר להוסיף תמונה גם בהמשך.",
  RU: "Фотографию можно добавить и позже.",
  EN: "You can also add a photo later.",
};
const HINT_LINE_2: Record<Lang, string> = {
  HE: "לא מצאתם עכשיו את התמונה המתאימה? תוכלו להוסיף אותה גם אחרי כן.",
  RU: "Не нашли подходящую фотографию сейчас? Можно продолжить и добавить её потом.",
  EN: "Haven't found the right one yet? You can continue and add it afterwards.",
};
const OR_LABEL: Record<Lang, string> = { HE: "או", RU: "или", EN: "or" };
const ADD_PHOTO_LABEL: Record<Lang, string> = { HE: "הוספת תמונה", RU: "Добавить фотографию", EN: "Add photo" };
const CHANGE_PHOTO_LABEL: Record<Lang, string> = { HE: "שינוי תמונה", RU: "Изменить фото", EN: "Change photo" };
const TAKE_PHOTO_LABEL: Record<Lang, string> = { HE: "צלמו עכשיו במצלמה", RU: "Сделать фото сейчас", EN: "Take a photo now" };
const FORMAT_HINT: Record<Lang, string> = {
  HE: "פורמטים נתמכים: JPG, PNG, HEIC",
  RU: "Поддерживаемые форматы: JPG, PNG, HEIC",
  EN: "Supported formats: JPG, PNG, HEIC",
};
const SIZE_HINT: Record<Lang, string> = {
  HE: "גודל מומלץ עד 10MB",
  RU: "Рекомендуемый размер: до 10 МБ",
  EN: "Recommended size: up to 10MB",
};
const CONTINUE_LABEL: Record<Lang, string> = {
  HE: "המשך לשלב הבא",
  RU: "Перейти к следующему шагу",
  EN: "Continue to the next step",
};
const BACK_LABEL: Record<Lang, string> = {
  HE: "חזרה לשלב הקודם",
  RU: "Вернуться к предыдущему шагу",
  EN: "Back to the previous step",
};

function PhotoAddIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <rect x="2" y="4" width="22" height="17" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="9" cy="10" r="1.6" fill="currentColor" />
      <path d="M3.5 18 9 12.5l3.5 3.5 3.5-4L22.5 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
      <path
        d="M2.5 6c0-.8.7-1.5 1.5-1.5h1.3l.7-1.2c.2-.4.6-.6 1-.6h3.2c.4 0 .8.2 1 .6l.7 1.2H14c.8 0 1.5.7 1.5 1.5v7c0 .8-.7 1.5-1.5 1.5H4c-.8 0-1.5-.7-1.5-1.5V6Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="9.5" r="2.6" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M9 15.2S2.8 11.4 2.8 6.9C2.8 4.7 4.5 3.2 6.5 3.2c1.1 0 2.2.6 2.5 1.5.3-.9 1.4-1.5 2.5-1.5 2 0 3.7 1.5 3.7 3.7 0 4.5-6.2 8.3-6.2 8.3z"
        stroke="#8b7fd6"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// The text/form side only (no photo panel) — split out so the admin build
// page can pair it with PhotoDropPanel below directly under its own outer
// book shell, the same way every other step there works. Rendering the full
// PhotoStep (form + its own photo panel) inside that shell was producing two
// photo panels stacked side by side (its own, plus the build page's usual
// trailing one) instead of one.
export function PhotoStepForm({
  lang,
  photoRequestText,
  photoRequestTextPlaceholder,
  onPhotoRequestTextChange,
  onPhotoRequestTextBlur,
  onPhotoChange,
  onBack,
  onNext,
  isSaving,
  error,
  stepNumber,
  stepTotal,
}: {
  lang: Lang;
  photoRequestText: string;
  // Shown as the textarea's native placeholder when photoRequestText is
  // empty — the resolved fallback text, so the admin sees exactly what a
  // guest would see by default rather than a generic "click to add text".
  photoRequestTextPlaceholder?: string;
  // Present only when this is being edited from the admin build page — swaps
  // the plain subtext paragraph for a directly-editable textarea, styled the
  // same either way so Edit and Preview mode there look identical.
  onPhotoRequestTextChange?: (value: string) => void;
  onPhotoRequestTextBlur?: () => void;
  onPhotoChange: (file: File | null) => void;
  onBack: () => void;
  onNext: () => void;
  isSaving: boolean;
  error: string | null;
  stepNumber: number;
  stepTotal: number;
}) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const isEditable = typeof onPhotoRequestTextChange === "function";

  return (
    <div className="sub-page sub-page-form" dir={lang === "HE" ? "rtl" : "ltr"}>
      <div className="sub-page-form-top">
        <p className="sub-eyebrow">
          {STEP_OF_LABEL[lang](stepNumber, stepTotal)} · {SHORT_LABEL[lang]}
        </p>
        <h1 className="sub-heading">{STEP_TITLE[lang]}</h1>
      </div>

      <div className="sub-page-form-scroll">
        {isEditable ? (
          <textarea
            className="sub-photo-subtext sub-photo-subtext-editable"
            rows={3}
            value={photoRequestText}
            placeholder={photoRequestTextPlaceholder}
            onChange={(e) => onPhotoRequestTextChange(e.target.value)}
            onBlur={onPhotoRequestTextBlur}
          />
        ) : (
          <p className="sub-photo-subtext">{photoRequestText}</p>
        )}

        <div className="sub-photo-hint-box">
          <div>
            <p className="sub-photo-hint-line1">{HINT_LINE_1[lang]}</p>
            <p className="sub-photo-hint-line2">{HINT_LINE_2[lang]}</p>
          </div>
          <HeartIcon />
        </div>

        <div className="sub-photo-or-row">
          <hr />
          <span>{OR_LABEL[lang]}</span>
          <hr />
        </div>

        <button type="button" className="sub-photo-camera-btn" onClick={() => cameraInputRef.current?.click()}>
          <span>{TAKE_PHOTO_LABEL[lang]}</span>
          <CameraIcon />
        </button>
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => onPhotoChange(e.target.files?.[0] ?? null)}
          style={{ display: "none" }}
        />

        <p className="sub-photo-format-hint">{FORMAT_HINT[lang]}</p>
        <p className="sub-photo-format-hint">{SIZE_HINT[lang]}</p>
      </div>

      <StepBottomNav
        lang={lang}
        continueLabel={CONTINUE_LABEL[lang]}
        onContinue={onNext}
        backLabel={BACK_LABEL[lang]}
        onBack={onBack}
        isSaving={isSaving}
        error={error}
      />
    </div>
  );
}

// The photo panel only — the empty state shows the project's cover photo as
// a 40%-opacity backdrop with an "add photo" button centered over it; a real
// uploaded photo replaces it at full opacity with a "change photo" overlay.
export function PhotoDropPanel({
  lang,
  photoPreviewUrl,
  coverImageUrl,
  onPhotoChange,
}: {
  lang: Lang;
  photoPreviewUrl: string | null;
  coverImageUrl?: string | null;
  onPhotoChange: (file: File | null) => void;
}) {
  return (
    <div className="sub-page sub-page-photo">
      <label className={`sub-photo-drop${photoPreviewUrl ? " has-photo" : ""}`}>
        {photoPreviewUrl ? (
          <>
            <img
              src={photoPreviewUrl}
              alt=""
              className="sub-photo-img"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <span className="sub-photo-change">{CHANGE_PHOTO_LABEL[lang]}</span>
          </>
        ) : (
          <>
            {coverImageUrl && <img src={coverImageUrl} alt="" className="sub-photo-drop-backdrop" />}
            {/* Styled as a floating button (white pill, shadow) but kept a
                <span> — it sits inside the <label> that already triggers the
                file picker, and nesting a real <button> inside a <label>
                is unreliable across browsers. */}
            <span className="sub-photo-add-circle">
              <span className="sub-photo-add-icon">
                <PhotoAddIcon />
                <span className="sub-photo-add-badge">+</span>
              </span>
              <span className="sub-photo-add-label">{ADD_PHOTO_LABEL[lang]}</span>
            </span>
          </>
        )}
        <input
          type="file"
          accept="image/*,.heic,.heif"
          onChange={(e) => onPhotoChange(e.target.files?.[0] ?? null)}
          style={{ display: "none" }}
        />
      </label>
    </div>
  );
}

export default function PhotoStep(
  props: Parameters<typeof PhotoStepForm>[0] &
    Pick<Parameters<typeof PhotoDropPanel>[0], "photoPreviewUrl" | "coverImageUrl">
) {
  const { photoPreviewUrl, coverImageUrl, ...formProps } = props;
  return (
    <>
      <PhotoStepForm {...formProps} />
      <div className="sub-spine" />
      <PhotoDropPanel
        lang={props.lang}
        photoPreviewUrl={photoPreviewUrl}
        coverImageUrl={coverImageUrl}
        onPhotoChange={props.onPhotoChange}
      />
    </>
  );
}
