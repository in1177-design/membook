import SubmissionBook from "../SubmissionBook";
import type { Lang, LangContent, Question, StepId } from "../types";

export default function PreviewStep({
  content,
  lang,
  answers,
  questions,
  dateLocation,
  photoUrl,
  photoFileName,
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
}: {
  content: Record<Lang, LangContent>;
  lang: Lang;
  answers: Record<string, string>;
  questions: Question[];
  dateLocation: string;
  photoUrl: string | null;
  photoFileName?: string | null;
  blessingText?: string | null;
  blessingSignedBy?: string | null;
  onBackToEdit: () => void;
  onEdit?: (step: Extract<StepId, "blessing" | "answerQuestion" | "photo">) => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  // True when nothing has changed since the last successful send — nothing
  // meaningful to resubmit, so the send button stays disabled until the
  // guest edits something. Optional so callers with no real submission
  // state (none today) aren't forced to pass it.
  confirmDisabled?: boolean;
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
      photoFileName={photoFileName}
      blessingText={blessingText}
      blessingSignedBy={blessingSignedBy}
      onBackToEdit={onBackToEdit}
      onEdit={onEdit}
      onConfirm={onConfirm}
      isSubmitting={isSubmitting}
      confirmDisabled={confirmDisabled}
      error={error}
      stepNumber={stepNumber}
      stepTotal={stepTotal}
    />
  );
}
