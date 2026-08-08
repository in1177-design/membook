"use client";

import { useReducer } from "react";
import { BOOK_STYLES, PhotoPage } from "./SubmissionBook";
import IntroStep from "./steps/IntroStep";
import QuestionsStep from "./steps/QuestionsStep";
import PhotoDateStep from "./steps/PhotoDateStep";
import ChooseQuestionStep from "./steps/ChooseQuestionStep";
import AnswerQuestionStep from "./steps/AnswerQuestionStep";
import BlessingStep from "./steps/BlessingStep";
import PhotoStep, { PhotoDropPanel } from "./steps/PhotoStep";
import PreviewStep from "./steps/PreviewStep";
import DoneStep from "./steps/DoneStep";
import type { Lang, LangContent, Question, QuestionMode, StepId, WizardAction } from "./types";
import { STEP_OF_LABEL, type IntroGuidance } from "./content";

type SaveStatus = "idle" | "saving" | "saved" | "error";
type SubmitStatus = "idle" | "pending" | "error";

type WizardState = {
  step: StepId;
  lang: Lang;
  answers: Record<string, string>;
  blessingText: string;
  blessingSignedBy: string;
  dateLocation: string;
  activeQuestionId: string | null;
  photo: File | null;
  photoPreviewUrl: string | null;
  saveStatus: SaveStatus;
  saveError: string | null;
  submitStatus: SubmitStatus;
  submitError: string | null;
};

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "SET_LANG":
      return { ...state, lang: action.lang };
    case "SET_ANSWER":
      return { ...state, answers: { ...state.answers, [action.questionId]: action.text } };
    case "SET_ACTIVE_QUESTION":
      return { ...state, activeQuestionId: action.id };
    case "SET_BLESSING_TEXT":
      return { ...state, blessingText: action.text };
    case "SET_BLESSING_SIGNED_BY":
      return { ...state, blessingSignedBy: action.value };
    case "SET_DATE_LOCATION":
      return { ...state, dateLocation: action.value };
    case "SET_PHOTO":
      return { ...state, photo: action.file, photoPreviewUrl: action.previewUrl };
    case "GO_TO_STEP":
      return { ...state, step: action.step, submitStatus: "idle", submitError: null };
    case "SAVE_START":
      return { ...state, saveStatus: "saving", saveError: null };
    case "SAVE_SUCCESS":
      return { ...state, saveStatus: "saved" };
    case "SAVE_ERROR":
      return { ...state, saveStatus: "error", saveError: action.error };
    case "SUBMIT_START":
      return { ...state, submitStatus: "pending", submitError: null };
    case "SUBMIT_ERROR":
      return { ...state, submitStatus: "error", submitError: action.error };
    default:
      return state;
  }
}

const STEP_ORDER_ALL: StepId[] = ["intro", "questions", "photoDate", "preview"];
const STEP_ORDER_PICK_ONE: StepId[] = ["intro", "blessing", "chooseQuestion", "answerQuestion", "photo", "preview"];

export const WIZARD_EXTRA_STYLES = `
  .sub-lang-switch { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
  .sub-lang-switch-label { font-size: 11px; color: #9a9a9a; }
  .sub-lang-btn { font-size: 12px; font-weight: 700; padding: 5px 12px; border-radius: 999px; border: 1px solid #d8d6d1; background: white; color: #767676; cursor: pointer; }
  .sub-lang-btn.active { background: #2f3f8f; border-color: #2f3f8f; color: white; }

  .sub-progress { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
  .sub-progress-label { font-size: 11px; color: #9a9a9a; white-space: nowrap; }
  .sub-progress-bar { flex: 1; height: 4px; border-radius: 999px; background: #e6e4e0; overflow: hidden; }
  .sub-progress-fill { height: 100%; background: #3b57d6; border-radius: 999px; transition: width 0.2s; }

  .sub-opening-text { font-size: 15px; color: #55524c; line-height: 1.6; margin: 0; }

  .sub-intro-guidance { margin-top: 18px; }
  .sub-intro-guidance-heading { font-size: 14px; font-weight: 700; color: #2f3f8f; margin: 16px 0 8px; }
  .sub-intro-guidance-steps { margin: 0; padding-inline-start: 20px; display: grid; gap: 6px; }
  .sub-intro-guidance-steps li { font-size: 14px; color: #55524c; line-height: 1.6; }
  .sub-intro-guidance-closing { font-size: 14px; color: #55524c; line-height: 1.6; margin: 0; }

  .sub-eyebrow { font-size: 13px; font-weight: 700; letter-spacing: 1.6px; text-transform: uppercase; color: #7c6fdc; margin: 0 0 8px; }
  .sub-heading { font-size: 26px; font-weight: 700; color: #1a1a1a; margin: 0 0 8px; }

  .sub-date-input { width: 100%; padding: 12px 14px; font-size: 14px; border: 1px solid #e6e4e0; border-radius: 10px; background: #f7f6f4; box-sizing: border-box; }
  .sub-date-input::placeholder { color: #adabA6; }

  .sub-questions { display: grid; gap: 12px; margin: 4px 0 22px; }
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
    padding: 10px 12px;
    font-size: 14px;
    line-height: 1.6;
    border: 1px solid #e6e4e0;
    border-radius: 8px;
    resize: vertical;
    box-sizing: border-box;
    font-family: inherit;
    background-color: #fff;
  }
  .sub-q-textarea:disabled { background-color: #f7f6f4; color: #8a8883; cursor: default; }
  .sub-date-input:disabled { background-color: #f0efec; color: #8a8883; cursor: default; }
  .sub-q-answered-dot { flex-shrink: 0; width: 7px; height: 7px; border-radius: 50%; background: #3fb37f; }

  .sub-actions { display: flex; gap: 12px; margin-top: 4px; }
  .sub-btn { flex: 1; padding: 13px 16px; font-size: 14px; font-weight: 700; border-radius: 10px; cursor: pointer; }
  .sub-btn-draft { background: white; border: 1px solid #d8d6d1; color: #3b57d6; }
  .sub-btn-draft:disabled { opacity: 0.6; cursor: default; }
  .sub-btn-send { background: #2f3f8f; border: none; color: white; }
  .sub-btn-send:disabled { opacity: 0.6; cursor: default; }

  .sub-choose-list { display: grid; gap: 6px; margin: 4px 0 22px; }
  .sub-choose-option {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    width: 100%; padding: 16px 18px; font: inherit; text-align: inherit;
    border: 1.5px solid #e6e4e0; border-radius: 12px; background: #fff; cursor: pointer;
    transition: border-color 0.15s, background-color 0.15s;
  }
  .sub-choose-option.selected { border-color: #2f3f8f; background: #eef1f8; }
  /* Up to 3 lines per box, longer text ellipsized past that — keeps every
     option a consistent, compact height instead of growing unboundedly. */
  .sub-choose-option-text {
    font-size: 15px; font-weight: 600; color: #1a1a1a; line-height: 1.4;
    display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
  }
  .sub-choose-radio {
    flex-shrink: 0; width: 22px; height: 22px; border-radius: 50%;
    border: 1.5px solid #c9c7c2; display: flex; align-items: center; justify-content: center;
  }
  .sub-choose-radio.checked { background: #2f3f8f; border-color: #2f3f8f; }
  .sub-choose-surprise {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    width: 100%; padding: 14px 18px; font: inherit; font-size: 14px; color: #767676;
    border: 1.5px dashed #d8d6d1; border-radius: 12px; background: #fafaf9; cursor: pointer;
  }
  /* Shared bottom nav (StepBottomNav.tsx): one full-width continue button +
     a plain-text back link below it — used by every step being migrated to
     the newer design (chooseQuestion, blessing, more to follow). */
  .sub-step-bottom { display: flex; flex-direction: column; align-items: center; gap: 14px; }
  .sub-step-continue { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; }
  .sub-step-back {
    display: flex; align-items: center; gap: 4px; background: none; border: none;
    font-size: 14px; font-weight: 700; color: #2f3f8f; cursor: pointer; padding: 4px;
  }
  .sub-step-back:disabled { opacity: 0.6; cursor: default; }

  /* A plain single-line text input styled to look exactly as "open for
     writing" as .sub-q-textarea — used for short free-text fields like the
     blessing step's name field (previously borrowed .sub-date-input, which
     is meant to look like a muted display field, not an inviting one). */
  .sub-text-input { width: 100%; padding: 10px 12px; font-size: 14px; border: 1px solid #e6e4e0; border-radius: 8px; box-sizing: border-box; font-family: inherit; background-color: #fff; }

  /* Step 4 (photo) — subtext under the heading, an inline hint box with a
     heart icon, an "or" divider, an outlined camera button, format/size
     hints, and the empty drop-zone's backdrop photo + "add" circle. */
  .sub-photo-subtext { font-size: 14px; color: #55524c; line-height: 1.6; margin: 0 0 16px; }
  .sub-photo-subtext-editable { width: 100%; resize: vertical; border: 1px solid #f0c419; background: #fdf6d8; border-radius: 8px; padding: 8px 10px; box-sizing: border-box; font-family: inherit; }
  .sub-photo-subtext-editable:focus { outline: 2px solid #f0c419; }
  .sub-photo-hint-box { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 14px 16px; border-radius: 12px; background: #f1effb; margin-bottom: 18px; }
  .sub-photo-hint-line1 { font-size: 13px; font-weight: 700; color: #3a3a3a; margin: 0 0 4px; }
  .sub-photo-hint-line2 { font-size: 12px; color: #767676; margin: 0; line-height: 1.5; }
  .sub-photo-or-row { display: flex; align-items: center; gap: 12px; margin: 4px 0 18px; }
  .sub-photo-or-row hr { flex: 1; border: none; border-top: 1px solid #e6e4e0; margin: 0; }
  .sub-photo-or-row span { font-size: 12px; color: #9a9a9a; }
  .sub-photo-camera-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 13px 16px; font-size: 14px; font-weight: 700; color: #3b57d6; background: white; border: 1.5px solid #3b57d6; border-radius: 10px; cursor: pointer; margin-bottom: 14px; }
  .sub-photo-format-hint { font-size: 12px; color: #9a9a9a; text-align: center; margin: 2px 0; }

  .sub-photo-drop-backdrop { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.4; }
  .sub-photo-add-circle { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; width: 150px; height: 150px; border-radius: 50%; background: rgba(255,255,255,0.92); box-shadow: 0 6px 24px rgba(0,0,0,0.1); }
  .sub-photo-add-icon { position: relative; color: #5b4fc4; }
  .sub-photo-add-badge { position: absolute; bottom: -2px; inset-inline-end: -4px; width: 18px; height: 18px; border-radius: 50%; background: #5b4fc4; color: white; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
  .sub-photo-add-label { font-size: 13px; font-weight: 700; color: #5b4fc4; }

  /* Step 6 (done) — centered success message: a big check-circle icon, a
     heading, a short thank-you paragraph, and a small closing note. */
  .sub-done-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 14px; min-height: 100%; padding: 20px 0; }
  .sub-done-icon-circle { width: 72px; height: 72px; border-radius: 50%; background: #eaf7ee; display: flex; align-items: center; justify-content: center; color: #3fb37f; flex-shrink: 0; }
  .sub-done-heading { font-size: 26px; font-weight: 700; color: #1a1a1a; margin: 0; }
  .sub-done-subtext { font-size: 15px; color: #55524c; line-height: 1.7; margin: 0; max-width: 360px; }
  .sub-done-note { font-size: 13px; color: #9a9a9a; margin: 4px 0 0; }
`;

export default function SubmissionWizard({
  token,
  headlineTexts,
  content,
  introTexts,
  introGuidance,
  eventTypeLabels,
  photoRequestTexts,
  blessingPromptTexts,
  coverImageUrl,
  initialLanguage,
  questions,
  questionMode,
  isCompleted,
  existingPhotoUrl,
  existingDateLocation,
  existingBlessingText,
  existingBlessingSignedBy,
  previewMode = false,
}: {
  token: string;
  headlineTexts: Record<Lang, string>;
  content: Record<Lang, LangContent>;
  introTexts: Record<Lang, string>;
  introGuidance: Record<string, IntroGuidance>;
  eventTypeLabels: Record<Lang, string>;
  photoRequestTexts: Record<Lang, string>;
  blessingPromptTexts: Record<Lang, string>;
  coverImageUrl?: string | null;
  initialLanguage: string;
  questions: Question[];
  questionMode: QuestionMode;
  isCompleted: boolean;
  existingPhotoUrl?: string | null;
  existingDateLocation?: string | null;
  existingBlessingText?: string | null;
  existingBlessingSignedBy?: string | null;
  previewMode?: boolean;
}) {
  const initialLang: Lang = initialLanguage === "RU" || initialLanguage === "EN" ? initialLanguage : "HE";
  const hasAnyProgress =
    questions.some((q) => q.existingAnswer.trim().length > 0) ||
    Boolean(existingDateLocation?.trim()) ||
    Boolean(existingBlessingText?.trim()) ||
    Boolean(existingPhotoUrl);
  const chosenQuestionId = questions.find((q) => q.existingAnswer.trim().length > 0)?.id ?? null;
  const hasBlessingProgress = Boolean(existingBlessingText?.trim());
  const hasPhotoProgress = Boolean(existingPhotoUrl);

  function initialStepPickOne(): StepId {
    if (isCompleted) return "done";
    if (!hasBlessingProgress && !chosenQuestionId && !hasPhotoProgress) return "intro";
    if (!hasBlessingProgress) return "blessing";
    if (!chosenQuestionId) return "chooseQuestion";
    if (!hasPhotoProgress) return "photo";
    return "preview";
  }

  const initialStep: StepId =
    questionMode === "PICK_ONE"
      ? initialStepPickOne()
      : isCompleted
        ? "done"
        : hasAnyProgress
          ? "questions"
          : "intro";
  const initialActiveQuestionId = questionMode === "PICK_ONE" ? chosenQuestionId : questions[0]?.id ?? null;

  const [state, dispatch] = useReducer(wizardReducer, {
    step: initialStep,
    lang: initialLang,
    answers: Object.fromEntries(questions.map((q) => [q.id, q.existingAnswer])),
    blessingText: existingBlessingText ?? "",
    blessingSignedBy: existingBlessingSignedBy ?? "",
    dateLocation: existingDateLocation ?? "",
    activeQuestionId: initialActiveQuestionId,
    photo: null,
    photoPreviewUrl: existingPhotoUrl ?? null,
    saveStatus: "idle",
    saveError: null,
    submitStatus: "idle",
    submitError: null,
  });

  const c = content[state.lang];
  const chosenQuestion = questions.find((q) => q.id === state.activeQuestionId) ?? null;

  async function uploadPhoto(file: File) {
    if (previewMode) {
      // Nothing is persisted in preview mode — keep the local blob preview as-is.
      return null;
    }
    const signRes = await fetch("/api/cloudinary/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (!signRes.ok) throw new Error("לא הצלחנו להתחיל את העלאת התמונה");
    const sign = await signRes.json();

    const uploadData = new FormData();
    uploadData.append("file", file);
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
      cloudinaryPublicId: uploaded.public_id as string,
      url: uploaded.secure_url as string,
      width: uploaded.width as number | undefined,
      height: uploaded.height as number | undefined,
      format: uploaded.format as string | undefined,
    };
  }

  async function postSubmission(opts: {
    kind: "autosave" | "final";
    answers: { questionId: string; text: string }[];
    dateLocation?: string;
    blessingText?: string;
    blessingSignedBy?: string;
    mediaAsset?: { cloudinaryPublicId: string; url: string; width?: number; height?: number; format?: string } | null;
  }) {
    if (previewMode) return;
    const res = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        kind: opts.kind,
        answers: opts.answers,
        dateLocation: opts.dateLocation,
        blessingText: opts.blessingText,
        blessingSignedBy: opts.blessingSignedBy,
        mediaAsset: opts.mediaAsset ?? null,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error ?? "משהו השתבש, נסי שוב");
    }
  }

  function handlePhotoChange(file: File | null) {
    if (state.photoPreviewUrl && state.photoPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(state.photoPreviewUrl);
    }
    dispatch({
      type: "SET_PHOTO",
      file,
      previewUrl: file ? URL.createObjectURL(file) : existingPhotoUrl ?? null,
    });
  }

  async function handleBlurAnswer(questionId: string) {
    const text = state.answers[questionId] ?? "";
    dispatch({ type: "SAVE_START" });
    try {
      await postSubmission({ kind: "autosave", answers: [{ questionId, text }] });
      dispatch({ type: "SAVE_SUCCESS" });
    } catch (e) {
      dispatch({ type: "SAVE_ERROR", error: e instanceof Error ? e.message : "שגיאה" });
    }
  }

  async function handleNextFromQuestions() {
    dispatch({ type: "SAVE_START" });
    try {
      await postSubmission({
        kind: "autosave",
        answers: Object.entries(state.answers).map(([questionId, text]) => ({ questionId, text })),
      });
      dispatch({ type: "SAVE_SUCCESS" });
    } catch (e) {
      dispatch({ type: "SAVE_ERROR", error: e instanceof Error ? e.message : "שגיאה" });
    }
    dispatch({ type: "GO_TO_STEP", step: "photoDate" });
  }

  async function handleNextFromPhotoDate() {
    dispatch({ type: "SAVE_START" });
    try {
      const mediaAsset = state.photo ? await uploadPhoto(state.photo) : null;
      await postSubmission({
        kind: "autosave",
        answers: [],
        dateLocation: state.dateLocation,
        mediaAsset,
      });
      if (mediaAsset) {
        dispatch({ type: "SET_PHOTO", file: null, previewUrl: mediaAsset.url });
      }
      dispatch({ type: "SAVE_SUCCESS" });
      dispatch({ type: "GO_TO_STEP", step: "preview" });
    } catch (e) {
      dispatch({ type: "SAVE_ERROR", error: e instanceof Error ? e.message : "משהו השתבש בהעלאת התמונה, נסי שוב" });
    }
  }

  function handleChooseQuestion(questionId: string) {
    dispatch({ type: "SET_ACTIVE_QUESTION", id: questionId });
    dispatch({ type: "GO_TO_STEP", step: "answerQuestion" });
  }

  async function handleNextFromAnswerQuestion() {
    dispatch({ type: "SAVE_START" });
    try {
      const questionId = state.activeQuestionId;
      await postSubmission({
        kind: "autosave",
        answers: questionId ? [{ questionId, text: state.answers[questionId] ?? "" }] : [],
      });
      dispatch({ type: "SAVE_SUCCESS" });
    } catch (e) {
      dispatch({ type: "SAVE_ERROR", error: e instanceof Error ? e.message : "שגיאה" });
    }
    dispatch({ type: "GO_TO_STEP", step: "photo" });
  }

  async function handleNextFromBlessing() {
    dispatch({ type: "SAVE_START" });
    try {
      await postSubmission({
        kind: "autosave",
        answers: [],
        blessingText: state.blessingText,
        blessingSignedBy: state.blessingSignedBy,
      });
      dispatch({ type: "SAVE_SUCCESS" });
    } catch (e) {
      dispatch({ type: "SAVE_ERROR", error: e instanceof Error ? e.message : "שגיאה" });
    }
    dispatch({ type: "GO_TO_STEP", step: "chooseQuestion" });
  }

  async function handleNextFromPhoto() {
    dispatch({ type: "SAVE_START" });
    try {
      const mediaAsset = state.photo ? await uploadPhoto(state.photo) : null;
      await postSubmission({
        kind: "autosave",
        answers: [],
        mediaAsset,
      });
      if (mediaAsset) {
        dispatch({ type: "SET_PHOTO", file: null, previewUrl: mediaAsset.url });
      }
      dispatch({ type: "SAVE_SUCCESS" });
      dispatch({ type: "GO_TO_STEP", step: "preview" });
    } catch (e) {
      dispatch({ type: "SAVE_ERROR", error: e instanceof Error ? e.message : "משהו השתבש בהעלאת התמונה, נסי שוב" });
    }
  }

  async function handleConfirmFinal() {
    dispatch({ type: "SUBMIT_START" });
    try {
      await postSubmission({
        kind: "final",
        answers: Object.entries(state.answers).map(([questionId, text]) => ({ questionId, text })),
        dateLocation: state.dateLocation,
        ...(questionMode === "PICK_ONE"
          ? { blessingText: state.blessingText, blessingSignedBy: state.blessingSignedBy }
          : {}),
        mediaAsset: null,
      });
      dispatch({ type: "GO_TO_STEP", step: "done" });
    } catch (e) {
      dispatch({ type: "SUBMIT_ERROR", error: e instanceof Error ? e.message : "משהו השתבש, נסי שוב" });
    }
  }

  const stepOrder = questionMode === "PICK_ONE" ? STEP_ORDER_PICK_ONE : STEP_ORDER_ALL;
  const stepIndex = stepOrder.indexOf(state.step);
  const backToEditStep: StepId = questionMode === "PICK_ONE" ? "answerQuestion" : "questions";
  // "done" isn't part of stepOrder (it comes after everything in it) — for
  // PICK_ONE, stepOrder.length already equals the true displayed total (the
  // chooseQuestion/answerQuestion merge absorbs the one extra array entry),
  // so done is simply that same total, both as its own number and as the
  // total. ALL mode has no such merge, so done is one past stepOrder.length.
  const doneStepNumber = questionMode === "PICK_ONE" ? stepOrder.length : stepOrder.length + 1;

  return (
    <>
      <style>{`${BOOK_STYLES}${WIZARD_EXTRA_STYLES}`}</style>

      {previewMode && (
        <div
          style={{
            background: "#fff4d6",
            border: "1px solid #e8d38a",
            color: "#6b5410",
            borderRadius: 10,
            padding: "10px 14px",
            fontSize: 13,
            fontWeight: 600,
            textAlign: "center",
            marginBottom: 16,
          }}
        >
          תצוגה מקדימה בלבד — זה בדיוק מה שהמשתתף/ת יראה, אבל שום דבר כאן לא נשמר
        </div>
      )}

      {state.step !== "done" && (
        <div className="sub-lang-switch">
          <span className="sub-lang-switch-label">שפה:</span>
          {(["HE", "RU", "EN"] as Lang[]).map((l) => (
            <button
              key={l}
              type="button"
              className={`sub-lang-btn${state.lang === l ? " active" : ""}`}
              onClick={() => dispatch({ type: "SET_LANG", lang: l })}
            >
              {l}
            </button>
          ))}
        </div>
      )}

      {stepIndex >= 0 && (
        <div className="sub-progress">
          <span className="sub-progress-label">{STEP_OF_LABEL[state.lang](stepIndex + 1, stepOrder.length)}</span>
          <div className="sub-progress-bar">
            <div className="sub-progress-fill" style={{ width: `${((stepIndex + 1) / stepOrder.length) * 100}%` }} />
          </div>
        </div>
      )}

      {state.step === "done" ? (
        <DoneStep
          lang={state.lang}
          // No photo of their own → fall back to the project's cover photo,
          // same fallback every other step's trailing panel already uses,
          // rather than an empty placeholder on the "all done" screen.
          photoUrl={state.photoPreviewUrl ?? (questionMode === "PICK_ONE" ? coverImageUrl ?? null : null)}
          stepNumber={doneStepNumber}
          stepTotal={doneStepNumber}
          onBackToEdit={() => dispatch({ type: "GO_TO_STEP", step: backToEditStep })}
        />
      ) : state.step === "preview" ? (
        <PreviewStep
          content={content}
          lang={state.lang}
          answers={state.answers}
          questions={questions}
          dateLocation={state.dateLocation}
          photoUrl={state.photoPreviewUrl}
          blessingText={questionMode === "PICK_ONE" ? state.blessingText : null}
          blessingSignedBy={questionMode === "PICK_ONE" ? state.blessingSignedBy : null}
          onBackToEdit={() => dispatch({ type: "GO_TO_STEP", step: backToEditStep })}
          onConfirm={handleConfirmFinal}
          isSubmitting={state.submitStatus === "pending"}
          error={state.submitError}
          // PICK_ONE's chooseQuestion/answerQuestion share one displayed step
          // number (see their own call sites above), which pulls every step
          // after them one number lower than its raw array position — using
          // the 0-based index here (instead of +1) already accounts for that.
          // ALL mode has no such merge, so it needs the standard +1.
          stepNumber={questionMode === "PICK_ONE" ? stepIndex : stepIndex + 1}
          stepTotal={stepOrder.length}
        />
      ) : state.step === "photoDate" ? (
        <div className="sub-book-outer">
          <div className="sub-book">
            <PhotoDateStep
              lang={state.lang}
              c={c}
              dateLocation={state.dateLocation}
              onDateLocationChange={(value) => dispatch({ type: "SET_DATE_LOCATION", value })}
              photoPreviewUrl={state.photoPreviewUrl}
              onPhotoChange={handlePhotoChange}
              onBack={() => dispatch({ type: "GO_TO_STEP", step: "questions" })}
              onNext={handleNextFromPhotoDate}
              isSaving={state.saveStatus === "saving"}
              error={state.saveError}
            />
          </div>
        </div>
      ) : state.step === "photo" ? (
        <div className="sub-book-outer">
          <div className="sub-book">
            <PhotoStep
              lang={state.lang}
              photoRequestText={photoRequestTexts[state.lang]}
              photoPreviewUrl={state.photoPreviewUrl}
              coverImageUrl={coverImageUrl}
              onPhotoChange={handlePhotoChange}
              onBack={() => dispatch({ type: "GO_TO_STEP", step: "answerQuestion" })}
              onNext={handleNextFromPhoto}
              isSaving={state.saveStatus === "saving"}
              error={state.saveError}
              // PICK_ONE's chooseQuestion/answerQuestion share one displayed
              // step number (see their own call sites above) — the 0-based
              // index here already accounts for that, same as Step 5's.
              stepNumber={stepOrder.indexOf("photo")}
              stepTotal={stepOrder.length}
            />
          </div>
        </div>
      ) : (
        <div className="sub-book-outer">
          <div className="sub-book">
            {state.step === "intro" ? (
              <IntroStep
                lang={state.lang}
                projectName={headlineTexts[state.lang]}
                c={c}
                eventTypeLabel={eventTypeLabels[state.lang]}
                introText={introTexts[state.lang]}
                guidance={introGuidance[state.lang]}
                onStart={() =>
                  dispatch({ type: "GO_TO_STEP", step: questionMode === "PICK_ONE" ? "blessing" : "questions" })
                }
              />
            ) : state.step === "chooseQuestion" ? (
              <ChooseQuestionStep
                questions={questions}
                lang={state.lang}
                c={c}
                selectedId={state.activeQuestionId}
                onChoose={handleChooseQuestion}
                onBack={() => dispatch({ type: "GO_TO_STEP", step: "blessing" })}
                stepNumber={stepIndex + 1}
                stepTotal={stepOrder.length}
              />
            ) : state.step === "answerQuestion" && chosenQuestion ? (
              <AnswerQuestionStep
                question={chosenQuestion}
                lang={state.lang}
                c={c}
                answer={state.answers[chosenQuestion.id] ?? ""}
                onAnswerChange={(text) => dispatch({ type: "SET_ANSWER", questionId: chosenQuestion.id, text })}
                onBack={() => dispatch({ type: "GO_TO_STEP", step: "chooseQuestion" })}
                onNext={handleNextFromAnswerQuestion}
                isSaving={state.saveStatus === "saving"}
                error={state.saveError}
                stepNumber={stepOrder.indexOf("chooseQuestion") + 1}
                stepTotal={stepOrder.length}
              />
            ) : state.step === "answerQuestion" ? (
              <ChooseQuestionStep
                questions={questions}
                lang={state.lang}
                c={c}
                selectedId={state.activeQuestionId}
                onChoose={handleChooseQuestion}
                onBack={() => dispatch({ type: "GO_TO_STEP", step: "blessing" })}
                stepNumber={stepIndex + 1}
                stepTotal={stepOrder.length}
              />
            ) : state.step === "blessing" ? (
              <BlessingStep
                lang={state.lang}
                c={c}
                blessingText={state.blessingText}
                blessingSignedBy={state.blessingSignedBy}
                blessingPromptText={blessingPromptTexts[state.lang]}
                onBlessingTextChange={(text) => dispatch({ type: "SET_BLESSING_TEXT", text })}
                onBlessingSignedByChange={(value) => dispatch({ type: "SET_BLESSING_SIGNED_BY", value })}
                onBack={() => dispatch({ type: "GO_TO_STEP", step: "intro" })}
                onNext={handleNextFromBlessing}
                isSaving={state.saveStatus === "saving"}
                error={state.saveError}
                stepNumber={stepIndex + 1}
                stepTotal={stepOrder.length}
              />
            ) : (
              <QuestionsStep
                questions={questions}
                lang={state.lang}
                c={c}
                answers={state.answers}
                activeQuestionId={state.activeQuestionId}
                dispatch={dispatch}
                onBlurAnswer={handleBlurAnswer}
                onBack={() => dispatch({ type: "GO_TO_STEP", step: "intro" })}
                onNext={handleNextFromQuestions}
              />
            )}
            <div className="sub-spine" />
            {state.step === "blessing" || state.step === "chooseQuestion" || state.step === "answerQuestion" ? (
              // Steps 2-4 (blessing, question, photo) all show the same
              // "add a photo" invitation — the project's cover photo at 40%
              // opacity with an upload circle over it, already-uploaded
              // photos shown in full — instead of intro's plain cover-photo
              // panel. Wired to the same handlePhotoChange as the photo
              // step itself, so a photo added here already shows up there.
              <PhotoDropPanel
                lang={state.lang}
                photoPreviewUrl={state.photoPreviewUrl}
                coverImageUrl={coverImageUrl}
                onPhotoChange={handlePhotoChange}
              />
            ) : (
              <PhotoPage
                photoUrl={state.photoPreviewUrl ?? (questionMode === "PICK_ONE" ? coverImageUrl ?? null : null)}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
