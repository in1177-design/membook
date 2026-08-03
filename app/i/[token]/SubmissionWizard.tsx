"use client";

import { useReducer } from "react";
import SubmissionBook, { BOOK_STYLES, PhotoPage } from "./SubmissionBook";
import IntroStep from "./steps/IntroStep";
import QuestionsStep from "./steps/QuestionsStep";
import PhotoDateStep from "./steps/PhotoDateStep";
import ChooseQuestionStep from "./steps/ChooseQuestionStep";
import AnswerQuestionStep from "./steps/AnswerQuestionStep";
import BlessingStep from "./steps/BlessingStep";
import PhotoStep from "./steps/PhotoStep";
import PreviewStep from "./steps/PreviewStep";
import type { Lang, LangContent, Question, QuestionMode, StepId, WizardAction } from "./types";

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
const STEP_ORDER_PICK_ONE: StepId[] = ["intro", "chooseQuestion", "answerQuestion", "blessing", "photo", "preview"];

const STEP_OF_LABEL: Record<Lang, (n: number, total: number) => string> = {
  HE: (n, total) => `שלב ${n} מתוך ${total}`,
  RU: (n, total) => `Шаг ${n} из ${total}`,
  EN: (n, total) => `Step ${n} of ${total}`,
};

const WIZARD_EXTRA_STYLES = `
  .sub-lang-switch { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
  .sub-lang-switch-label { font-size: 11px; color: #9a9a9a; }
  .sub-lang-btn { font-size: 12px; font-weight: 700; padding: 5px 12px; border-radius: 999px; border: 1px solid #d8d6d1; background: white; color: #767676; cursor: pointer; }
  .sub-lang-btn.active { background: #2f3f8f; border-color: #2f3f8f; color: white; }

  .sub-progress { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
  .sub-progress-label { font-size: 11px; color: #9a9a9a; white-space: nowrap; }
  .sub-progress-bar { flex: 1; height: 4px; border-radius: 999px; background: #e6e4e0; overflow: hidden; }
  .sub-progress-fill { height: 100%; background: #3b57d6; border-radius: 999px; transition: width 0.2s; }

  .sub-opening-text { font-size: 15px; color: #55524c; line-height: 1.6; margin: 0; }
  .sub-cover-image { width: 100%; max-height: 220px; object-fit: cover; object-position: left center; border-radius: 12px; margin-bottom: 14px; }

  .sub-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 1.6px; text-transform: uppercase; color: #9a9a9a; margin: 0 0 8px; }
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
`;

export default function SubmissionWizard({
  token,
  projectName,
  content,
  introTexts,
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
  projectName: string;
  content: Record<Lang, LangContent>;
  introTexts: Record<Lang, string>;
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
    if (!chosenQuestionId) return "intro";
    if (!hasBlessingProgress) return "blessing";
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
    dispatch({ type: "GO_TO_STEP", step: "blessing" });
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
    dispatch({ type: "GO_TO_STEP", step: "photo" });
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
        <SubmissionBook
          content={content}
          lang={state.lang}
          answers={state.answers}
          questions={questions}
          dateLocation={state.dateLocation}
          photoUrl={state.photoPreviewUrl}
          blessingText={questionMode === "PICK_ONE" ? state.blessingText : null}
          blessingSignedBy={questionMode === "PICK_ONE" ? state.blessingSignedBy : null}
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
              c={c}
              photoRequestText={photoRequestTexts[state.lang]}
              photoPreviewUrl={state.photoPreviewUrl}
              onPhotoChange={handlePhotoChange}
              onBack={() => dispatch({ type: "GO_TO_STEP", step: "blessing" })}
              onNext={handleNextFromPhoto}
              isSaving={state.saveStatus === "saving"}
              error={state.saveError}
            />
          </div>
        </div>
      ) : (
        <div className="sub-book-outer">
          <div className="sub-book">
            {state.step === "intro" ? (
              <IntroStep
                projectName={projectName}
                c={c}
                introText={introTexts[state.lang]}
                coverImageUrl={questionMode === "PICK_ONE" ? coverImageUrl ?? null : null}
                onStart={() =>
                  dispatch({ type: "GO_TO_STEP", step: questionMode === "PICK_ONE" ? "chooseQuestion" : "questions" })
                }
              />
            ) : state.step === "chooseQuestion" ? (
              <ChooseQuestionStep
                questions={questions}
                lang={state.lang}
                c={c}
                onChoose={handleChooseQuestion}
                onBack={() => dispatch({ type: "GO_TO_STEP", step: "intro" })}
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
              />
            ) : state.step === "answerQuestion" ? (
              <ChooseQuestionStep
                questions={questions}
                lang={state.lang}
                c={c}
                onChoose={handleChooseQuestion}
                onBack={() => dispatch({ type: "GO_TO_STEP", step: "intro" })}
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
                onBack={() => dispatch({ type: "GO_TO_STEP", step: "answerQuestion" })}
                onNext={handleNextFromBlessing}
                isSaving={state.saveStatus === "saving"}
                error={state.saveError}
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
            <PhotoPage photoUrl={state.photoPreviewUrl} />
          </div>
        </div>
      )}
    </>
  );
}
