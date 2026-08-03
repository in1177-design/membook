import SubmissionBook from "../SubmissionBook";
import type { Lang, LangContent, Question } from "../types";

export default function PreviewStep({
  content,
  lang,
  answers,
  questions,
  dateLocation,
  photoUrl,
  blessingText,
  blessingSignedBy,
  onBackToEdit,
  onConfirm,
  isSubmitting,
  error,
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
  onConfirm: () => void;
  isSubmitting: boolean;
  error: string | null;
}) {
  const c = content[lang];
  return (
    <>
      <SubmissionBook
        content={content}
        lang={lang}
        answers={answers}
        questions={questions}
        dateLocation={dateLocation}
        photoUrl={photoUrl}
        blessingText={blessingText}
        blessingSignedBy={blessingSignedBy}
        onBackToEdit={onBackToEdit}
      />
      <div style={{ maxWidth: 1000, margin: "16px auto 0", textAlign: "center" }}>
        {error && <p style={{ color: "#b00020", marginBottom: 12, fontSize: 13 }}>{error}</p>}
        <button
          type="button"
          className="sub-btn sub-btn-send"
          style={{ maxWidth: 280 }}
          onClick={onConfirm}
          disabled={isSubmitting}
        >
          {isSubmitting ? "..." : c.submitLabel}
        </button>
      </div>
    </>
  );
}
