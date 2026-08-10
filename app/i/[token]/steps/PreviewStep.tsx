import SubmissionBook from "../SubmissionBook";
import type { Lang, LangContent, Question, StepId } from "../types";

export default function PreviewStep({
  content,
  lang,
  answers,
  questions,
  dateLocation,
  photoUrl,
  hasOwnPhoto,
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
  isSubmittedView,
}: {
  content: Record<Lang, LangContent>;
  lang: Lang;
  answers: Record<string, string>;
  questions: Question[];
  dateLocation: string;
  photoUrl: string | null;
  // False when photoUrl is only the project's cover-photo fallback, not a
  // real photo the guest uploaded — see SubmissionBook's same-named prop.
  hasOwnPhoto?: boolean;
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
  // True for a returning guest who already completed their submission AND
  // hasn't changed anything since — swaps the "before sending" review copy/
  // progress bar/send button for an "already sent" message, while still
  // allowing edits via the per-section edit links. Editing anything flips
  // this back to the normal pre-send view. See SubmissionWizard's
  // isCompleted && !hasChanges.
  isSubmittedView?: boolean;
}) {
  return (
    <SubmissionBook
      content={content}
      lang={lang}
      answers={answers}
      questions={questions}
      dateLocation={dateLocation}
      photoUrl={photoUrl}
      hasOwnPhoto={hasOwnPhoto}
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
      isSubmittedView={isSubmittedView}
    />
  );
}
