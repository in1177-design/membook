export type Lang = "HE" | "RU" | "EN";

export type QuestionMode = "ALL" | "PICK_ONE";

export type LangContent = {
  eyebrow: string;
  intro: string;
  photoLabel: string;
  photoHint: string;
  submitLabel: string;
  dateLocationLabel: string;
  dateLocationPlaceholder: string;
  backToEditLabel: string;
  answersHeading: string;
  startLabel: string;
  nextLabel: string;
  backLabel: string;
};

export type Question = {
  id: string;
  textHe: string;
  textRu?: string;
  textEn?: string;
  helperTextHe?: string;
  helperTextRu?: string;
  helperTextEn?: string;
  existingAnswer: string;
};

export function questionText(q: Question, lang: Lang): string {
  if (lang === "RU") return q.textRu ?? q.textHe;
  if (lang === "EN") return q.textEn ?? q.textHe;
  return q.textHe;
}

export function questionHelper(q: Question, lang: Lang): string | undefined {
  if (lang === "RU") return q.helperTextRu ?? q.helperTextHe;
  if (lang === "EN") return q.helperTextEn ?? q.helperTextHe;
  return q.helperTextHe;
}

export type StepId =
  | "intro"
  | "questions" // ALL only
  | "photoDate" // ALL only
  | "chooseQuestion" // PICK_ONE only
  | "answerQuestion" // PICK_ONE only
  | "blessing" // PICK_ONE only
  | "photo" // PICK_ONE only
  | "preview"
  | "done";

export type WizardAction =
  | { type: "SET_LANG"; lang: Lang }
  | { type: "SET_ANSWER"; questionId: string; text: string }
  | { type: "SET_ACTIVE_QUESTION"; id: string | null }
  | { type: "SET_BLESSING_TEXT"; text: string }
  | { type: "SET_BLESSING_SIGNED_BY"; value: string }
  | { type: "SET_DATE_LOCATION"; value: string }
  | { type: "SET_PHOTO"; file: File | null; previewUrl: string | null }
  | { type: "GO_TO_STEP"; step: StepId }
  | { type: "SAVE_START" }
  | { type: "SAVE_SUCCESS" }
  | { type: "SAVE_ERROR"; error: string }
  | { type: "SUBMIT_START" }
  | { type: "SUBMIT_ERROR"; error: string };
