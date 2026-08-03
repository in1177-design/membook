import type { Lang, LangContent } from "../types";

const STEP_TITLE: Record<Lang, string> = {
  HE: "ברכה וחתימה",
  RU: "Пожелание и подпись",
  EN: "Blessing & signature",
};
const BLESSING_LABEL: Record<Lang, string> = { HE: "ברכה", RU: "Пожелание", EN: "Blessing" };
const SIGNED_BY_LABEL: Record<Lang, string> = { HE: "מאת", RU: "От", EN: "From" };

export default function BlessingStep({
  lang,
  c,
  blessingText,
  blessingSignedBy,
  blessingPromptText,
  onBlessingTextChange,
  onBlessingSignedByChange,
  onBack,
  onNext,
  isSaving,
  error,
}: {
  lang: Lang;
  c: LangContent;
  blessingText: string;
  blessingSignedBy: string;
  blessingPromptText: string;
  onBlessingTextChange: (text: string) => void;
  onBlessingSignedByChange: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
  isSaving: boolean;
  error: string | null;
}) {
  return (
    <div className="sub-page sub-page-form">
      <div className="sub-page-form-top">
        <p className="sub-eyebrow">{STEP_TITLE[lang]}</p>
      </div>

      <div className="sub-page-form-scroll">
        <div style={{ display: "grid", gap: 14 }}>
          <label>
            <span className="sub-field-label">{BLESSING_LABEL[lang]}</span>
            <textarea
              className="sub-q-textarea"
              style={{ marginTop: 8 }}
              value={blessingText}
              onChange={(e) => onBlessingTextChange(e.target.value)}
              placeholder={blessingPromptText}
              rows={6}
              autoFocus
            />
          </label>
          <label>
            <span className="sub-field-label">{SIGNED_BY_LABEL[lang]}</span>
            <input
              className="sub-date-input"
              style={{ marginTop: 8 }}
              value={blessingSignedBy}
              onChange={(e) => onBlessingSignedByChange(e.target.value)}
            />
          </label>
        </div>
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
  );
}
