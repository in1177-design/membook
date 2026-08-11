"use client";

import { useEffect, useReducer, useState } from "react";
import { BOOK_STYLES, PhotoPage, MobileHero } from "./SubmissionBook";
import AdjustableCoverHero from "./AdjustableCoverHero";
import IntroStep from "./steps/IntroStep";
import QuestionsStep from "./steps/QuestionsStep";
import PhotoDateStep from "./steps/PhotoDateStep";
import ChooseQuestionStep from "./steps/ChooseQuestionStep";
import AnswerQuestionStep from "./steps/AnswerQuestionStep";
import BlessingStep from "./steps/BlessingStep";
import PhotoStep, { PhotoDropPanel } from "./steps/PhotoStep";
import PreviewStep from "./steps/PreviewStep";
import DoneStep from "./steps/DoneStep";
import { questionText } from "./types";
import type { Lang, LangContent, Question, QuestionMode, StepId, WizardAction } from "./types";
import type { IntroGuidance } from "./content";

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
  // What was actually saved as of the last successful final submit (seeded
  // from the invitee's existing submission on first mount) — compared
  // against the live fields above to decide whether there's anything new to
  // send (see hasChanges below).
  baselineAnswers: Record<string, string>;
  baselineBlessingText: string;
  baselineBlessingSignedBy: string;
  baselineDateLocation: string;
  baselinePhotoUrl: string | null;
};

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "SET_LANG":
      return { ...state, lang: action.lang };
    case "SET_ANSWER":
      return { ...state, answers: { ...state.answers, [action.questionId]: action.text } };
    case "SET_ACTIVE_QUESTION":
      // Only ever dispatched from the PICK_ONE chooseQuestion step — exactly
      // one question should ever be answered, so switching to a different
      // question drops any other question's typed/saved answer instead of
      // leaving it in state.answers alongside the new one (which used to
      // mean handleConfirmFinal's Object.entries(state.answers) sent BOTH,
      // saving two Answer rows for a project meant to have just one).
      return {
        ...state,
        activeQuestionId: action.id,
        answers: action.id ? { [action.id]: state.answers[action.id] ?? "" } : {},
      };
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
    case "SYNC_BASELINE":
      return {
        ...state,
        baselineAnswers: state.answers,
        baselineBlessingText: state.blessingText,
        baselineBlessingSignedBy: state.blessingSignedBy,
        baselineDateLocation: state.dateLocation,
        baselinePhotoUrl: state.photoPreviewUrl,
      };
    default:
      return state;
  }
}

const STEP_ORDER_ALL: StepId[] = ["intro", "questions", "photoDate", "preview"];
const STEP_ORDER_PICK_ONE: StepId[] = ["intro", "blessing", "chooseQuestion", "answerQuestion", "photo", "preview"];

// Shown via a styled .sub-confirm-* dialog (not the native window.confirm)
// before switching to a different question in PICK_ONE mode when the guest
// already has a saved answer to another one — only one answer is ever kept
// (see SET_ACTIVE_QUESTION's reducer case), so this is real, irreversible
// data loss the guest should confirm first.
const CHANGE_QUESTION_CONFIRM: Record<Lang, (oldQuestionText: string) => string> = {
  HE: (q) => `שינית שאלה — התשובה הקודמת שלך ל"${q}" תימחק ותוחלף בתשובה החדשה. להמשיך?`,
  RU: (q) => `Вы меняете вопрос — предыдущий ответ на «${q}» будет удалён и заменён новым. Продолжить?`,
  EN: (q) => `You're changing your question — your previous answer to "${q}" will be deleted and replaced by the new one. Continue?`,
};
const CHANGE_QUESTION_CONFIRM_LABEL: Record<Lang, string> = { HE: "המשך", RU: "Продолжить", EN: "Continue" };
const CHANGE_QUESTION_CANCEL_LABEL: Record<Lang, string> = { HE: "ביטול", RU: "Отмена", EN: "Cancel" };

// PICK_ONE's chooseQuestion/answerQuestion are two screens for the same
// logical "step 3" (choose a question, then write the answer) — displayed as
// the same step number, matching the user's Figma reference
// (designe/final figma/screen-3-question.png vs screen-3-question-1.png,
// both captioned "שלב 3 מתוך 6"). Centralized here so the shared progress
// bar and every step's own eyebrow always agree — previously each call site
// hand-adjusted its own array index, and had drifted out of sync with the
// shared progress bar above the book (which used the raw, un-adjusted
// index+1 for every step).
const STEP_DISPLAY_PICK_ONE: Partial<Record<StepId, number>> = {
  intro: 1,
  blessing: 2,
  chooseQuestion: 3,
  answerQuestion: 3,
  photo: 4,
  preview: 5,
  // "done" is virtual — never counted as its own numbered step (see
  // STEP_DISPLAY_TOTAL_PICK_ONE below); this entry only keeps the map
  // internally consistent for readers, it isn't read at runtime (the done
  // screen uses doneStepNumber instead, derived straight from the total).
  done: 5,
};
const STEP_DISPLAY_TOTAL_PICK_ONE = 5;

export const WIZARD_EXTRA_STYLES = `
  /* Segmented step-progress bar (StepProgress, in SubmissionBook.tsx) —
     rendered inside every step's own .sub-page-form-top, right under its
     eyebrow (which already carries the "Step N of Total · Label" text) and
     above its heading. Same position and look at every width — no
     mobile/desktop split needed here, since it now lives inside the book's
     own text column instead of spanning above the whole book. */
  .sub-progress-pills { display: flex; gap: 6px; margin: 8px 0 16px; }
  .sub-progress-pill { flex: 1; height: 4px; border-radius: 999px; background: #e6e4e0; }
  .sub-progress-pill.filled { background: #5838b8; }

  .sub-opening-text { font-size: 16px; color: #55524c; line-height: 1.6; margin: 0; text-align: center; }

  .sub-intro-guidance { margin-top: 18px; }
  .sub-intro-guidance-heading { font-size: 16px; font-weight: 700; color: #5838b8; margin: 16px 0 8px; text-align: center; }
  /* Desktop-only plain list (see @container below); mobile shows the card
     version instead (.sub-intro-step-list, further down). */
  .sub-intro-guidance-steps { display: none; }
  .sub-intro-guidance-steps li { font-size: 16px; color: #55524c; line-height: 1.6; }
  .sub-intro-guidance-closing { font-size: 16px; color: #55524c; line-height: 1.6; margin: 0; text-align: center; }

  .sub-intro-step-list { display: grid; gap: 8px; margin: 4px 0; }
  .sub-intro-step-card { display: flex; align-items: center; justify-content: space-between; gap: 12px; border: 1px solid #e6e4e0; border-radius: 12px; padding: 14px 16px; }
  .sub-intro-step-text { font-size: 16px; color: #55524c; line-height: 1.5; }
  .sub-intro-step-text strong { color: #2b2b2b; }
  .sub-intro-step-badge { flex-shrink: 0; width: 30px; height: 30px; border-radius: 50%; border: 1.5px solid #5838b8; color: #5838b8; font-size: 14px; font-weight: 700; display: flex; align-items: center; justify-content: center; }

  .sub-eyebrow { font-size: 13px; font-weight: 700; letter-spacing: 1.6px; text-transform: uppercase; color: #5838b8; margin: 0 0 8px; text-align: center; }
  .sub-heading { font-size: 26px; font-weight: 700; color: #1a1a1a; margin: 0 0 8px; text-align: center; }

  /* Mobile default 18px / desktop 16px (@container below) — every guest-
     facing text box across the wizard (this field, .sub-q-textarea,
     .sub-text-input) shares this same pair of sizes; the previous flat 14px
     read as too small, especially on mobile. */
  .sub-date-input { width: 100%; padding: 12px 14px; font-size: 18px; border: 1px solid #e6e4e0; border-radius: 10px; background: #f7f6f4; box-sizing: border-box; }
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
  .sub-q-helper { font-size: 16px; color: #949494; margin: -4px 0 8px; }
  .sub-q-textarea {
    width: 100%;
    padding: 10px 12px;
    font-size: 18px;
    line-height: 1.6;
    border: 1px solid #e6e4e0;
    border-radius: 8px;
    resize: vertical;
    box-sizing: border-box;
    font-family: inherit;
    background-color: #f5f3ff;
  }
  .sub-q-textarea:disabled { background-color: #f7f6f4; color: #8a8883; cursor: default; }
  .sub-date-input:disabled { background-color: #f0efec; color: #8a8883; cursor: default; }
  .sub-q-answered-dot { flex-shrink: 0; width: 7px; height: 7px; border-radius: 50%; background: #3fb37f; }

  .sub-actions { display: flex; gap: 12px; margin-top: 4px; }
  .sub-btn { flex: 1; padding: 13px 16px; font-size: 14px; font-weight: 700; border-radius: 10px; cursor: pointer; }
  .sub-btn-draft { background: white; border: 1px solid #d8d6d1; color: #3b57d6; }
  .sub-btn-draft:disabled { opacity: 0.6; cursor: default; }
  .sub-btn-send { background: #5838b8; border: none; color: white; }
  .sub-btn-send:disabled { opacity: 0.6; cursor: default; }

  .sub-choose-list { display: grid; gap: 6px; margin: 4px 0 22px; }
  .sub-choose-option {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    width: 100%; padding: 16px 18px; font: inherit; text-align: inherit;
    border: 1.5px solid #e6e4e0; border-radius: 12px; background: #fff; cursor: pointer;
    transition: border-color 0.15s, background-color 0.15s;
  }
  .sub-choose-option.selected { border-color: #5838b8; background: #f5f3ff; }
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
  .sub-choose-radio.checked { background: #5838b8; border-color: #5838b8; }
  .sub-choose-surprise {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    width: 100%; padding: 14px 18px; font: inherit; font-size: 14px; color: #767676;
    border: 1.5px dashed #d8d6d1; border-radius: 12px; background: #fafaf9; cursor: pointer;
  }
  /* Shared bottom nav (StepBottomNav.tsx). Mobile default: both buttons
     full width, one below the other — same width as each other, same as the
     primary button. Desktop keeps the original 2-buttons-in-a-row pattern,
     equal width, side by side (@container below) — see that block for the
     row-reverse/JSX-order note. */
  .sub-step-bottom { display: flex; flex-direction: column; align-items: stretch; gap: 10px; }
  /* The buttons' own row — separate from .sub-step-bottom so beforeButtons/
     error always stack above the buttons, at every width; only this row
     itself switches to row-reverse at desktop (@container below). */
  .sub-step-buttons-row { display: flex; flex-direction: column; align-items: stretch; gap: 10px; }
  .sub-step-continue { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 13px 16px; border-radius: 10px; }
  .sub-step-back {
    /* 12px (not 13px) vertical padding — compensates for the 1px border on
       each side so its total height exactly matches .sub-step-continue
       (which has no border), per the user's request that both match. */
    display: flex; align-items: center; justify-content: center; gap: 4px;
    width: 100%; border: 1px solid #e6e4e0; border-radius: 10px; background: none; color: #5838b8;
    font-size: 14px; font-weight: 700; cursor: pointer; padding: 12px 20px; box-sizing: border-box;
  }
  .sub-step-back:disabled { opacity: 0.6; cursor: default; }
  /* No back-arrow on mobile — restored at desktop below. */
  .sub-step-back svg { display: none; }

  /* A plain single-line text input styled to look exactly as "open for
     writing" as .sub-q-textarea — used for short free-text fields like the
     blessing step's name field (previously borrowed .sub-date-input, which
     is meant to look like a muted display field, not an inviting one). */
  .sub-text-input { width: 100%; padding: 10px 12px; font-size: 18px; border: 1px solid #e6e4e0; border-radius: 8px; box-sizing: border-box; font-family: inherit; background-color: #fff; }

  /* Step 4 (photo) — subtext under the heading, an "or" divider, an
     outlined camera button, a single plain hint line above the nav
     buttons, and the empty drop-zone's backdrop photo + "add" circle. */
  .sub-photo-subtext { font-size: 16px; color: #55524c; line-height: 1.6; margin: 0 0 16px; text-align: center; }
  .sub-photo-subtext-editable { width: 100%; resize: vertical; border: 1px solid #f0c419; background: #fdf6d8; border-radius: 8px; padding: 8px 10px; box-sizing: border-box; font-family: inherit; }
  .sub-photo-subtext-editable:focus { outline: 2px solid #f0c419; }
  .sub-photo-or-row { display: flex; align-items: center; gap: 12px; margin: 4px 0 18px; }
  .sub-photo-or-row hr { flex: 1; border: none; border-top: 1px solid #e6e4e0; margin: 0; }
  .sub-photo-or-row span { font-size: 12px; color: #9a9a9a; }
  .sub-photo-camera-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 13px 16px; font-size: 14px; font-weight: 700; color: #5838b8; background: white; border: 1.5px solid #5838b8; border-radius: 10px; cursor: pointer; margin-bottom: 14px; }

  /* The drop-zone (real file picker, no camera capture) — the actual
     "choose from device" affordance, shown at every width now (previously
     mobile-only; PhotoDropPanel's own bigger panel still stays hidden on
     mobile). Format/size stack as two lines here by default; the @container
     rule below turns them into one row with a "|" separator at desktop
     widths, where there's room. */
  .sub-photo-inline-drop {
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
    text-align: center; min-height: 190px; padding: 24px 20px; margin-bottom: 18px; cursor: pointer;
    border-radius: 14px; border: 1.5px dashed #d8d6d1; background: #f5f3ff; color: #5b4fc4; box-sizing: border-box;
  }
  .sub-photo-inline-drop-title { font-size: 15px; font-weight: 700; color: #5838b8; margin-top: 4px; }
  .sub-photo-inline-drop-subtitle { font-size: 13px; color: #8a8883; }
  .sub-photo-inline-drop-resolution { font-size: 14px; font-weight: 700; color: #5838b8; max-width: 320px; margin: 4px 0 0; text-wrap: balance; }
  .sub-photo-inline-drop-divider { width: 100%; max-width: 220px; border: none; border-top: 1px solid #e2ddf5; margin: 10px 0 6px; }
  .sub-photo-inline-drop-hints { display: flex; flex-direction: column; align-items: center; gap: 2px; }
  .sub-photo-inline-drop-hint { font-size: 12px; color: #9a9a9a; }
  .sub-photo-inline-drop-hint-sep { display: none; font-size: 12px; color: #c9c7c2; }
  /* Selected-photo state: a square preview (width-driven via aspect-ratio,
     not the empty prompt's min-height) with a "change photo" badge pinned
     to its bottom-left corner. */
  .sub-photo-inline-drop.has-photo { position: relative; padding: 0; aspect-ratio: 1 / 1; min-height: 0; border-style: solid; border-color: #e6e4e0; background: #eee; overflow: hidden; }
  .sub-photo-inline-drop-img { display: block; width: 100%; height: 100%; object-fit: cover; position: absolute; inset: 0; }
  .sub-photo-inline-drop-change { position: absolute; left: 10px; bottom: 10px; z-index: 1; font-size: 12px; font-weight: 600; color: white; background: rgba(0,0,0,0.55); padding: 6px 14px; border-radius: 999px; }

  /* Plain hint line (heart icon + text, no box) rendered inside the fixed
     bottom block via StepBottomNav's beforeButtons — same at every width. */
  .sub-photo-hint-line { display: flex; align-items: center; justify-content: center; gap: 8px; margin: 0 0 12px; }
  .sub-photo-hint-line p { font-size: 14px; color: #767676; margin: 0; line-height: 1.5; }

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
  .sub-done-note { font-size: 16px; color: #9a9a9a; margin: 4px 0 0; }

  /* Desktop reverts — restores every mobile-default piece above to its
     original pre-redesign look, resolved against .sub-book-outer's
     container-type (declared in BOOK_STYLES), which trips at 860px. The
     progress pills have no desktop-specific look (same at every width, see
     above) so there's nothing to revert for them here. */
  @container (min-width: 860px) {
    .sub-intro-guidance-heading { color: #2f3f8f; }
    .sub-intro-guidance-steps { display: grid; margin: 0; padding-inline-start: 20px; gap: 6px; }
    .sub-intro-step-list { display: none; }
    .sub-eyebrow { color: #7c6fdc; }
    .sub-btn-send { background: #2f3f8f; }
    .sub-choose-option.selected { border-color: #2f3f8f; background: #eef1f8; }
    .sub-choose-radio.checked { background: #2f3f8f; border-color: #2f3f8f; }
    .sub-q-textarea { background-color: #fff; font-size: 16px; }
    .sub-text-input { font-size: 16px; }
    .sub-date-input { font-size: 16px; }
    /* Original 2-buttons-in-a-row pattern, same as Step 5's actions.
       row-reverse (not row) so the JSX order [continue, back] still lands
       continue/primary opposite back, matching Step 5's [back, send] JSX
       order under both RTL and LTR. */
    .sub-step-buttons-row { flex-direction: row-reverse; }
    .sub-step-continue { width: auto; flex: 1; padding: 13px 16px; }
    .sub-step-back {
      flex: 1; border-radius: 10px; border-color: #d8d6d1; background: white; color: #333;
      font-size: 14px; padding: 13px 16px;
    }
    .sub-step-back svg { display: block; }
    .sub-photo-camera-btn { color: #3b57d6; border-color: #3b57d6; }
    /* Narrative text back to its original start-alignment (right in RTL,
       left in LTR) at desktop — mobile default above centers all of these. */
    .sub-eyebrow, .sub-heading, .sub-opening-text, .sub-photo-subtext,
    .sub-intro-guidance-heading, .sub-intro-guidance-closing { text-align: start; }
    /* Step 4: format/size join into one row with a "|" separator at desktop
       widths — stacked as two plain lines below this. */
    .sub-photo-inline-drop-hints { flex-direction: row; gap: 8px; }
    .sub-photo-inline-drop-hint-sep { display: inline; }
    /* Step 4: no camera capture on desktop, so the "or take a photo now"
       button (and its "או" divider, which only makes sense as a lead-in to
       that button) both drop out — the drop-zone above is the only option. */
    .sub-photo-or-row, .sub-photo-camera-btn { display: none; }
  }

  /* PICK_ONE's "switching question" confirm — a real styled dialog instead
     of the native window.confirm() popup, matching the rest of the book's
     look (same purple/border-radius language as .sub-btn-send etc.). */
  .sub-confirm-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 60;
    display: flex; align-items: center; justify-content: center; padding: 24px; box-sizing: border-box;
  }
  .sub-confirm-card { width: min(380px, 100%); background: white; border-radius: 16px; padding: 22px 20px; box-sizing: border-box; }
  .sub-confirm-text { font-size: 15px; color: #333; line-height: 1.6; margin: 0 0 18px; }
  .sub-confirm-actions { display: flex; gap: 10px; }
  .sub-confirm-btn-primary {
    flex: 1; padding: 12px 0; border-radius: 10px; border: none; background: #5838b8; color: white;
    font-size: 14px; font-weight: 700; cursor: pointer;
  }
  .sub-confirm-btn-secondary {
    flex: 1; padding: 12px 0; border-radius: 10px; border: 1px solid #d8d6d1; background: white; color: #333;
    font-size: 14px; font-weight: 700; cursor: pointer;
  }
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
  coverImagePositionY,
  initialLanguage,
  questions,
  questionMode,
  isCompleted,
  existingPhotoUrl,
  existingDateLocation,
  existingBlessingText,
  existingBlessingSignedBy,
  previewMode = false,
  projectId,
  lang: controlledLang,
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
  // Vertical crop (0-100, object-position's Y%) for coverImageUrl's intro
  // hero — undefined/null renders centered (50), same as before this existed.
  coverImagePositionY?: number | null;
  initialLanguage: string;
  questions: Question[];
  questionMode: QuestionMode;
  isCompleted: boolean;
  existingPhotoUrl?: string | null;
  existingDateLocation?: string | null;
  existingBlessingText?: string | null;
  existingBlessingSignedBy?: string | null;
  previewMode?: boolean;
  // The real project id — only meaningful (and only ever passed) in
  // previewMode, so the admin's "התאם תמונה" cover-photo control has
  // somewhere to save to. Real guests never pass this.
  projectId?: string;
  // Present only when a parent owns the language toggle externally (the
  // admin's preview page, via PreviewDeviceFrame) — real guests have no such
  // parent, so this stays undefined and initialLanguage alone decides.
  lang?: Lang;
}) {
  const initialLang: Lang = initialLanguage === "RU" || initialLanguage === "EN" ? initialLanguage : "HE";
  // Deliberately excludes existingPhotoUrl — a real guest can only ever reach
  // the photo step *after* blessing/question progress (the steps are linear),
  // so photo-only progress with nothing else is never something a returning
  // guest could have produced themselves; it only happens when an admin
  // pre-loads a photo (AddInviteeForm/EditInviteeForm/AlbumPageView) before
  // the guest has ever opened the link. Counting it here would skip that
  // guest straight past the intro screen on their very first visit.
  const hasAnyProgress =
    questions.some((q) => q.existingAnswer.trim().length > 0) ||
    Boolean(existingDateLocation?.trim()) ||
    Boolean(existingBlessingText?.trim());
  const chosenQuestionId = questions.find((q) => q.existingAnswer.trim().length > 0)?.id ?? null;
  const hasBlessingProgress = Boolean(existingBlessingText?.trim());
  const hasPhotoProgress = Boolean(existingPhotoUrl);

  function initialStepPickOne(): StepId {
    // A guest who already completed their submission and reopens the link
    // lands on the summary (not the one-time "done" screen) so they can
    // review and, if they want, edit before re-sending.
    if (isCompleted) return "preview";
    // Same "photo alone doesn't count as progress" reasoning as
    // hasAnyProgress above — only real blessing/question progress should
    // skip the intro screen.
    if (!hasBlessingProgress && !chosenQuestionId) return "intro";
    if (!hasBlessingProgress) return "blessing";
    if (!chosenQuestionId) return "chooseQuestion";
    if (!hasPhotoProgress) return "photo";
    return "preview";
  }

  const initialStep: StepId =
    questionMode === "PICK_ONE"
      ? initialStepPickOne()
      : isCompleted
        ? "preview"
        : hasAnyProgress
          ? "questions"
          : "intro";
  const initialActiveQuestionId = questionMode === "PICK_ONE" ? chosenQuestionId : questions[0]?.id ?? null;

  const initialAnswers = Object.fromEntries(questions.map((q) => [q.id, q.existingAnswer]));
  const [state, dispatch] = useReducer(wizardReducer, {
    step: initialStep,
    lang: initialLang,
    answers: initialAnswers,
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
    baselineAnswers: initialAnswers,
    baselineBlessingText: existingBlessingText ?? "",
    baselineBlessingSignedBy: existingBlessingSignedBy ?? "",
    baselineDateLocation: existingDateLocation ?? "",
    baselinePhotoUrl: existingPhotoUrl ?? null,
  });

  // Pending question switch awaiting the guest's confirmation in the
  // .sub-confirm-* dialog (see handleChooseQuestion/CHANGE_QUESTION_CONFIRM
  // above) — null means no dialog is showing.
  const [pendingQuestionSwitch, setPendingQuestionSwitch] = useState<{ questionId: string; oldQuestionText: string } | null>(null);

  // Syncs an externally-owned language toggle (the admin preview's device
  // frame) into this wizard's own state — real guests never pass a
  // controlledLang, so this is a no-op for them.
  useEffect(() => {
    if (controlledLang !== undefined && controlledLang !== state.lang) {
      dispatch({ type: "SET_LANG", lang: controlledLang });
    }
  }, [controlledLang, state.lang]);

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

  function switchToQuestion(questionId: string) {
    dispatch({ type: "SET_ACTIVE_QUESTION", id: questionId });
    dispatch({ type: "GO_TO_STEP", step: "answerQuestion" });
  }

  function handleChooseQuestion(questionId: string) {
    const switchingAwayFromAnswered =
      state.activeQuestionId &&
      state.activeQuestionId !== questionId &&
      (state.answers[state.activeQuestionId] ?? "").trim().length > 0;
    if (switchingAwayFromAnswered) {
      const oldQuestion = questions.find((q) => q.id === state.activeQuestionId);
      setPendingQuestionSwitch({ questionId, oldQuestionText: oldQuestion ? questionText(oldQuestion, state.lang) : "" });
      return;
    }
    switchToQuestion(questionId);
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
      dispatch({ type: "SYNC_BASELINE" });
      dispatch({ type: "GO_TO_STEP", step: "done" });
    } catch (e) {
      dispatch({ type: "SUBMIT_ERROR", error: e instanceof Error ? e.message : "משהו השתבש, נסי שוב" });
    }
  }

  const stepOrder = questionMode === "PICK_ONE" ? STEP_ORDER_PICK_ONE : STEP_ORDER_ALL;
  const stepIndex = stepOrder.indexOf(state.step);
  const backToEditStep: StepId = questionMode === "PICK_ONE" ? "answerQuestion" : "questions";
  // The displayed "Step N of Total" for the current step — PICK_ONE uses the
  // centralized map above (chooseQuestion/answerQuestion share one number);
  // ALL mode has no such merge, so it's just the raw array position.
  const displayStepNumber =
    questionMode === "PICK_ONE" ? (STEP_DISPLAY_PICK_ONE[state.step] ?? stepIndex + 1) : stepIndex + 1;
  const displayStepTotal = questionMode === "PICK_ONE" ? STEP_DISPLAY_TOTAL_PICK_ONE : stepOrder.length;
  // "done" isn't part of stepOrder (it comes after everything in it), so it
  // isn't covered by stepIndex/displayStepNumber above — PICK_ONE's map
  // already has an explicit "done" entry (5) that agrees with
  // displayStepTotal; ALL mode has no such map, so it's one past its total.
  const doneStepNumber = questionMode === "PICK_ONE" ? STEP_DISPLAY_TOTAL_PICK_ONE : stepOrder.length + 1;
  // Whether there's anything new to send since the last successful final
  // submit — drives the summary page's send button (see PreviewStep below).
  // Compared against baseline* (seeded from the invitee's saved submission,
  // refreshed via SYNC_BASELINE after each successful send), not the props
  // directly, so a resubmit-then-return-without-editing correctly re-disables
  // it. All text compared trimmed so whitespace-only edits don't count.
  const hasChanges =
    Object.keys(state.answers).some(
      (id) => (state.answers[id] ?? "").trim() !== (state.baselineAnswers[id] ?? "").trim()
    ) ||
    state.blessingText.trim() !== state.baselineBlessingText.trim() ||
    state.blessingSignedBy.trim() !== state.baselineBlessingSignedBy.trim() ||
    state.dateLocation.trim() !== state.baselineDateLocation.trim() ||
    state.photo !== null ||
    state.photoPreviewUrl !== state.baselinePhotoUrl;

  return (
    <>
      <style>{`${BOOK_STYLES}${WIZARD_EXTRA_STYLES}`}</style>

      {pendingQuestionSwitch && (
        <div className="sub-confirm-overlay">
          <div className="sub-confirm-card" dir={state.lang === "HE" ? "rtl" : "ltr"}>
            <p className="sub-confirm-text">{CHANGE_QUESTION_CONFIRM[state.lang](pendingQuestionSwitch.oldQuestionText)}</p>
            <div className="sub-confirm-actions">
              <button
                type="button"
                className="sub-confirm-btn-primary"
                onClick={() => {
                  switchToQuestion(pendingQuestionSwitch.questionId);
                  setPendingQuestionSwitch(null);
                }}
              >
                {CHANGE_QUESTION_CONFIRM_LABEL[state.lang]}
              </button>
              <button type="button" className="sub-confirm-btn-secondary" onClick={() => setPendingQuestionSwitch(null)}>
                {CHANGE_QUESTION_CANCEL_LABEL[state.lang]}
              </button>
            </div>
          </div>
        </div>
      )}

      {previewMode && (
        <div
          style={{
            background: "#fff4d6",
            border: "1px solid #e8d38a",
            color: "#e07b1a",
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

      {/* Real guests get whatever language is registered for them
          (invitee.language, resolved into initialLanguage before this
          component even mounts) — no manual switcher. In previewMode the
          language toggle lives in PreviewDeviceFrame's own toolbar (next to
          the desktop/mobile toggle) and drives this wizard via the
          controlledLang sync effect above, so there's nothing to render
          here anymore. */}

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
          // Falls back to the project's cover photo once the guest hasn't
          // uploaded one yet, same fallback "done" already uses — the mobile
          // hero banner and the desktop side panel both use this same
          // resolved value.
          photoUrl={state.photoPreviewUrl ?? coverImageUrl ?? null}
          // True once the guest has a photo of their own (freshly picked or
          // previously uploaded) — false while photoUrl above is only the
          // project's cover-photo fallback, so the "עריכה" pill/panel become
          // an "הוספת תמונה" one instead (see SubmissionBook).
          hasOwnPhoto={state.photoPreviewUrl !== null}
          blessingText={questionMode === "PICK_ONE" ? state.blessingText : null}
          blessingSignedBy={questionMode === "PICK_ONE" ? state.blessingSignedBy : null}
          onBackToEdit={() => dispatch({ type: "GO_TO_STEP", step: backToEditStep })}
          onEdit={(step) => dispatch({ type: "GO_TO_STEP", step })}
          onConfirm={handleConfirmFinal}
          isSubmitting={state.submitStatus === "pending"}
          confirmDisabled={!hasChanges}
          error={state.submitError}
          stepNumber={displayStepNumber}
          stepTotal={displayStepTotal}
          // A guest who already completed their submission (isCompleted, set
          // once from the server on load) sees this same preview screen in a
          // read/edit "already sent" state instead of the pre-send review —
          // but only as long as nothing's actually changed since that last
          // send (!hasChanges). The moment they edit anything (blessing,
          // answer, photo) and land back here, hasChanges flips true and
          // this reverts to the normal "before sending" screen — step
          // eyebrow, progress bar and an enabled send button all come back,
          // so they can actually send the updated version.
          isSubmittedView={isCompleted && !hasChanges}
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
              stepNumber={displayStepNumber}
              stepTotal={displayStepTotal}
            />
          </div>
        </div>
      ) : (
        <div className="sub-book-outer">
          {/* Intro is always the project's cover photo, never the guest's
              own upload (even if they already have one from a prior visit) —
              unlike preview/done below, which show whichever the guest has. */}
          {state.step === "intro" &&
            (previewMode && projectId ? (
              <AdjustableCoverHero
                projectId={projectId}
                src={coverImageUrl}
                initialPositionY={coverImagePositionY ?? 50}
              />
            ) : (
              <MobileHero src={coverImageUrl} positionY={coverImagePositionY ?? 50} />
            ))}
          <div className="sub-book">
            {state.step === "intro" ? (
              <IntroStep
                lang={state.lang}
                projectName={headlineTexts[state.lang]}
                c={c}
                eventTypeLabel={eventTypeLabels[state.lang]}
                introText={introTexts[state.lang]}
                guidance={introGuidance[state.lang]}
                stepNumber={displayStepNumber}
                stepTotal={displayStepTotal}
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
                stepNumber={displayStepNumber}
                stepTotal={displayStepTotal}
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
                stepNumber={displayStepNumber}
                stepTotal={displayStepTotal}
              />
            ) : state.step === "answerQuestion" ? (
              <ChooseQuestionStep
                questions={questions}
                lang={state.lang}
                c={c}
                selectedId={state.activeQuestionId}
                onChoose={handleChooseQuestion}
                onBack={() => dispatch({ type: "GO_TO_STEP", step: "blessing" })}
                stepNumber={displayStepNumber}
                stepTotal={displayStepTotal}
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
                stepNumber={displayStepNumber}
                stepTotal={displayStepTotal}
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
                photoUrl={
                  state.step === "intro"
                    ? coverImageUrl ?? null
                    : state.photoPreviewUrl ?? (questionMode === "PICK_ONE" ? coverImageUrl ?? null : null)
                }
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
