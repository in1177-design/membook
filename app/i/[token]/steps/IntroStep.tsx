import type { LangContent } from "../types";

export default function IntroStep({
  projectName,
  c,
  introText,
  coverImageUrl,
  onStart,
}: {
  projectName: string;
  c: LangContent;
  introText: string;
  coverImageUrl?: string | null;
  onStart: () => void;
}) {
  return (
    <div className="sub-page sub-page-form">
      <div className="sub-page-form-top">
        <p className="sub-eyebrow">{c.eyebrow}</p>
        <h1 className="sub-heading">{projectName}</h1>
        <hr className="sub-divider" />
      </div>

      <div className="sub-page-form-scroll">
        {coverImageUrl && <img src={coverImageUrl} alt="" className="sub-cover-image" />}
        <p className="sub-opening-text">{introText}</p>
      </div>

      <div className="sub-page-form-bottom">
        <div className="sub-actions">
          <button type="button" className="sub-btn sub-btn-send" onClick={onStart}>
            {c.startLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
