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
  stepNumber,
  stepTotal,
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
  stepNumber: number;
  stepTotal: number;
}) {
  return (
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
      onConfirm={onConfirm}
      isSubmitting={isSubmitting}
      error={error}
      stepNumber={stepNumber}
      stepTotal={stepTotal}
    />
  );
}
