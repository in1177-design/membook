import type { Lang, LangContent } from "../types";

const STEP_TITLE: Record<Lang, string> = {
  HE: "תמונה ותאריך",
  RU: "Фото и дата",
  EN: "Photo & date",
};

export default function PhotoDateStep({
  lang,
  c,
  dateLocation,
  onDateLocationChange,
  photoPreviewUrl,
  onPhotoChange,
  onBack,
  onNext,
  isSaving,
  error,
}: {
  lang: Lang;
  c: LangContent;
  dateLocation: string;
  onDateLocationChange: (value: string) => void;
  photoPreviewUrl: string | null;
  onPhotoChange: (file: File | null) => void;
  onBack: () => void;
  onNext: () => void;
  isSaving: boolean;
  error: string | null;
}) {
  return (
    <>
      <div className="sub-page sub-page-form">
        <div className="sub-page-form-top">
          <p className="sub-eyebrow">{STEP_TITLE[lang]}</p>
          <hr className="sub-divider" />

          <label>
            <span className="sub-field-label">{c.dateLocationLabel}</span>
            <input
              className="sub-date-input"
              value={dateLocation}
              onChange={(e) => onDateLocationChange(e.target.value)}
              placeholder={c.dateLocationPlaceholder}
            />
          </label>
        </div>

        <div className="sub-page-form-bottom">
          {error && <p style={{ color: "#b00020", marginBottom: 12, fontSize: 13 }}>{error}</p>}
          <div className="sub-actions">
            <button type="button" className="sub-btn sub-btn-draft" onClick={onBack} disabled={isSaving}>
              {c.backLabel}
            </button>
            <button type="button" className="sub-btn sub-btn-send" onClick={onNext} disabled={isSaving}>
              {isSaving ? "..." : c.nextLabel}
            </button>
          </div>
        </div>
      </div>

      <div className="sub-spine" />

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
              <span className="sub-photo-change">שינוי תמונה</span>
            </>
          ) : (
            <>
              <span className="sub-photo-icon-circle">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M5.5 14.5a3 3 0 0 1-.6-5.94A4 4 0 0 1 12.7 6.2 3.5 3.5 0 0 1 14.5 13"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="M10 8.5v6M7.7 10.8 10 8.5l2.3 2.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="sub-photo-text">{c.photoLabel}</span>
              <span className="sub-photo-hint">{c.photoHint}</span>
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
    </>
  );
}
