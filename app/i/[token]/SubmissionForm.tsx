"use client";

import { useState } from "react";
import { Frank_Ruhl_Libre } from "next/font/google";

const headingFont = Frank_Ruhl_Libre({ subsets: ["hebrew", "latin"], weight: ["500", "700"] });

type Lang = "HE" | "RU" | "EN";

type LangContent = {
  eyebrow: string;
  intro: string;
  photoLabel: string;
  photoHint: string;
  submitLabel: string;
  draftLabel: string;
  dateLocationLabel: string;
  dateLocationPlaceholder: string;
  backToEditLabel: string;
  answersHeading: string;
};

type Question = {
  id: string;
  textHe: string;
  textRu?: string;
  textEn?: string;
  helperTextHe?: string;
  helperTextRu?: string;
  helperTextEn?: string;
  existingAnswer: string;
};

function questionText(q: Question, lang: Lang): string {
  if (lang === "RU") return q.textRu ?? q.textHe;
  if (lang === "EN") return q.textEn ?? q.textHe;
  return q.textHe;
}

function questionHelper(q: Question, lang: Lang): string | undefined {
  if (lang === "RU") return q.helperTextRu ?? q.helperTextHe;
  if (lang === "EN") return q.helperTextEn ?? q.helperTextHe;
  return q.helperTextHe;
}

const BOOK_STYLES = `
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

function PhotoPage({ photoUrl }: { photoUrl: string | null }) {
  return (
    <div className="sub-page sub-page-photo">
      <div className={`sub-photo-drop${photoUrl ? " has-photo" : ""}`}>
        {photoUrl && <img src={photoUrl} alt="" className="sub-photo-img" />}
      </div>
    </div>
  );
}

export default function SubmissionForm({
  token,
  projectName,
  content,
  introTexts,
  initialLanguage,
  questions,
  alreadySubmitted,
  existingPhotoUrl,
  existingDateLocation,
}: {
  token: string;
  projectName: string;
  content: Record<Lang, LangContent>;
  introTexts: Record<Lang, string>;
  initialLanguage: string;
  questions: Question[];
  alreadySubmitted: boolean;
  existingPhotoUrl?: string | null;
  existingDateLocation?: string | null;
}) {
  const [lang, setLang] = useState<Lang>(
    initialLanguage === "RU" || initialLanguage === "EN" ? initialLanguage : "HE"
  );
  const c = content[lang];

  const [answers, setAnswers] = useState<Record<string, string>>(
    Object.fromEntries(questions.map((q) => [q.id, q.existingAnswer]))
  );
  const [dateLocation, setDateLocation] = useState(existingDateLocation ?? "");
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(questions[0]?.id ?? null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(existingPhotoUrl ?? null);
  const [status, setStatus] = useState<"idle" | "pending" | "done" | "error">("idle");
  const [pendingKind, setPendingKind] = useState<"draft" | "final" | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handlePhotoChange(file: File | null) {
    if (photoPreviewUrl && photoPreviewUrl !== existingPhotoUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhoto(file);
    setPhotoPreviewUrl(file ? URL.createObjectURL(file) : existingPhotoUrl ?? null);
  }

  async function uploadPhoto(): Promise<{
    cloudinaryPublicId: string;
    url: string;
    width?: number;
    height?: number;
    format?: string;
  } | null> {
    if (!photo) return null;

    const signRes = await fetch("/api/cloudinary/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (!signRes.ok) throw new Error("לא הצלחנו להתחיל את העלאת התמונה");
    const sign = await signRes.json();

    const uploadData = new FormData();
    uploadData.append("file", photo);
    uploadData.append("api_key", sign.apiKey);
    uploadData.append("timestamp", String(sign.timestamp));
    uploadData.append("signature", sign.signature);
    uploadData.append("folder", sign.folder);
    uploadData.append("public_id", sign.publicId);
    uploadData.append("tags", sign.tag);

    const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`, {
      method: "POST",
      body: uploadData,
    });
    if (!uploadRes.ok) throw new Error("העלאת התמונה נכשלה");
    const uploaded = await uploadRes.json();

    return {
      cloudinaryPublicId: uploaded.public_id,
      url: uploaded.secure_url,
      width: uploaded.width,
      height: uploaded.height,
      format: uploaded.format,
    };
  }

  async function submit(kind: "draft" | "final") {
    setStatus("pending");
    setPendingKind(kind);
    setError(null);

    try {
      const mediaAsset = await uploadPhoto();

      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          answers: Object.entries(answers).map(([questionId, text]) => ({ questionId, text })),
          mediaAsset,
          dateLocation,
        }),
      });

      if (res.ok) {
        setStatus("done");
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "משהו השתבש, נסי שוב");
        setStatus("error");
      }
    } catch {
      setError("משהו השתבש בהעלאת התמונה, נסי שוב");
      setStatus("error");
    }
  }

  if (status === "done") {
    const answeredQuestions = questions.filter((q) => (answers[q.id] ?? "").trim().length > 0);
    return (
      <>
        <style>{`${BOOK_STYLES}
          .sub-summary-top { display: flex; justify-content: flex-end; margin-bottom: 40px; }
          .sub-back-btn { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; padding: 10px 18px; border-radius: 999px; border: 1px solid #d8d6d1; background: white; color: #2f3f8f; cursor: pointer; }
          .sub-summary-body { display: grid; gap: 20px; text-align: center; }
          .sub-summary-heading { font-size: 15px; font-style: italic; color: #8a7f6f; margin: 0 0 4px; font-family: ${headingFont.style.fontFamily}; }
          .sub-summary-answer { font-size: 16px; color: #333; line-height: 1.9; margin: 0; white-space: pre-wrap; text-align: center; }
          .sub-summary-dateloc { margin-top: 8px; text-align: center; }
          .sub-summary-dateloc .sub-field-label { text-align: center; }
          .sub-date-display { display: inline-block; padding: 12px 14px; font-size: 14px; border: 1px solid #e6e4e0; border-radius: 10px; background: #f7f6f4; color: #555; }
        `}</style>
        <div className="sub-book-outer">
          <div className="sub-book">
            <div className="sub-page sub-page-form">
              <div className="sub-summary-top">
                <button type="button" className="sub-back-btn" onClick={() => setStatus("idle")}>
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

                {dateLocation.trim() && (
                  <div className="sub-summary-dateloc">
                    <span className="sub-field-label">{c.dateLocationLabel}</span>
                    <div className="sub-date-display">{dateLocation}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="sub-spine" />

            <PhotoPage photoUrl={photoPreviewUrl} />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`${BOOK_STYLES}
        .sub-lang-switch { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
        .sub-lang-switch-label { font-size: 11px; color: #9a9a9a; }
        .sub-lang-btn { font-size: 12px; font-weight: 700; padding: 5px 12px; border-radius: 999px; border: 1px solid #d8d6d1; background: white; color: #767676; cursor: pointer; }
        .sub-lang-btn.active { background: #2f3f8f; border-color: #2f3f8f; color: white; }

        .sub-opening-text { font-size: 15px; color: #55524c; line-height: 1.6; margin: 0 0 24px; }

        .sub-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 1.6px; text-transform: uppercase; color: #9a9a9a; margin: 0 0 8px; }
        .sub-heading { font-size: 26px; font-weight: 700; color: #1a1a1a; margin: 0 0 8px; }

        .sub-date-input { width: 100%; padding: 12px 14px; font-size: 14px; border: 1px solid #e6e4e0; border-radius: 10px; background: #f7f6f4; box-sizing: border-box; }
        .sub-date-input::placeholder { color: #adabA6; }

        .sub-questions { display: grid; gap: 12px; margin: 20px 0 22px; }
        .sub-q { border: 1px solid #e6e4e0; border-radius: 12px; background: #fff; overflow: hidden; transition: border-color 0.15s; }
        .sub-q.active { border-color: #3b57d6; box-shadow: 0 0 0 3px rgba(59,87,214,0.08); }
        .sub-q-head { display: flex; align-items: center; gap: 12px; width: 100%; padding: 14px 16px; background: none; border: none; cursor: pointer; text-align: right; font: inherit; color: inherit; }
        .sub-q-avatar { flex-shrink: 0; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; background: #eceaf7; color: #6a75c9; }
        .sub-q.active .sub-q-avatar { background: #3b57d6; color: white; }
        .sub-q-title { flex: 1; font-size: 14px; font-weight: 600; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .sub-q.active .sub-q-title { white-space: normal; }
        .sub-q-chevron { flex-shrink: 0; color: #b5b3ae; transition: transform 0.15s; }
        .sub-q.active .sub-q-chevron { transform: rotate(180deg); }
        .sub-q-body { padding: 0 16px 16px; }
        .sub-q-helper { font-size: 12px; color: #949494; margin: -4px 0 8px; }
        .sub-q-textarea {
          width: 100%;
          padding: 8px 12px 0;
          font-size: 14px;
          line-height: 28px;
          border: 1px solid #e6e4e0;
          border-radius: 8px;
          resize: vertical;
          box-sizing: border-box;
          font-family: inherit;
          background-color: #fff;
          background-image: repeating-linear-gradient(to bottom, transparent 0, transparent 27px, #dcdade 27px, #dcdade 28px);
          background-attachment: local;
        }
        .sub-q-answered-dot { flex-shrink: 0; width: 7px; height: 7px; border-radius: 50%; background: #3fb37f; }

        .sub-actions { display: flex; gap: 12px; margin-top: 4px; }
        .sub-btn { flex: 1; padding: 13px 16px; font-size: 14px; font-weight: 700; border-radius: 10px; cursor: pointer; }
        .sub-btn-draft { background: white; border: 1px solid #d8d6d1; color: #3b57d6; }
        .sub-btn-draft:disabled { opacity: 0.6; cursor: default; }
        .sub-btn-send { background: #2f3f8f; border: none; color: white; }
        .sub-btn-send:disabled { opacity: 0.6; cursor: default; }
      `}</style>

      <div className="sub-lang-switch">
        <span className="sub-lang-switch-label">תצוגה (זמני):</span>
        {(["HE", "RU", "EN"] as Lang[]).map((l) => (
          <button
            key={l}
            type="button"
            className={`sub-lang-btn${lang === l ? " active" : ""}`}
            onClick={() => setLang(l)}
          >
            {l}
          </button>
        ))}
      </div>

      <p className="sub-opening-text">{introTexts[lang]}</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit("final");
        }}
      >
        {alreadySubmitted && (
          <p style={{ fontSize: 13, color: "#888", marginBottom: 16 }}>
            כבר שלחת תשובה — אפשר לערוך ולשלוח שוב.
          </p>
        )}

        <div className="sub-book-outer">
          <div className="sub-book">
            <div className="sub-page sub-page-form">
              <div className="sub-page-form-top">
                <p className="sub-eyebrow">{c.eyebrow}</p>
                <h1 className="sub-heading">{projectName}</h1>
                <hr className="sub-divider" />

                <label>
                  <span className="sub-field-label">{c.dateLocationLabel}</span>
                  <input
                    className="sub-date-input"
                    value={dateLocation}
                    onChange={(e) => setDateLocation(e.target.value)}
                    placeholder={c.dateLocationPlaceholder}
                  />
                </label>
              </div>

              <div className="sub-page-form-scroll">
                <div className="sub-questions">
                  {questions.map((q, i) => {
                    const isActive = activeQuestionId === q.id;
                    const hasAnswer = (answers[q.id] ?? "").trim().length > 0;
                    return (
                      <div key={q.id} className={`sub-q${isActive ? " active" : ""}`}>
                        <button
                          type="button"
                          className="sub-q-head"
                          onClick={() => setActiveQuestionId(isActive ? null : q.id)}
                        >
                          <span className="sub-q-avatar">{i + 1}</span>
                          <span className="sub-q-title">{questionText(q, lang)}</span>
                          {hasAnswer && !isActive && <span className="sub-q-answered-dot" />}
                          <svg className="sub-q-chevron" width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                        {isActive && (
                          <div className="sub-q-body">
                            {questionHelper(q, lang) && <p className="sub-q-helper">{questionHelper(q, lang)}</p>}
                            <textarea
                              className="sub-q-textarea"
                              value={answers[q.id] ?? ""}
                              onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                              rows={4}
                              autoFocus
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="sub-page-form-bottom">
                {error && <p style={{ color: "#b00020", marginBottom: 12, fontSize: 13 }}>{error}</p>}

                <div className="sub-actions">
                  <button
                    type="button"
                    className="sub-btn sub-btn-draft"
                    disabled={status === "pending"}
                    onClick={() => submit("draft")}
                  >
                    {status === "pending" && pendingKind === "draft" ? "שומר..." : c.draftLabel}
                  </button>
                  <button type="submit" className="sub-btn sub-btn-send" disabled={status === "pending"}>
                    {status === "pending" && pendingKind === "final" ? "שולח..." : c.submitLabel}
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
                  onChange={(e) => handlePhotoChange(e.target.files?.[0] ?? null)}
                  style={{ display: "none" }}
                />
              </label>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}
