"use client";

import { Fragment, useState } from "react";
import IntroStep from "../../../../i/[token]/steps/IntroStep";
import BlessingStep from "../../../../i/[token]/steps/BlessingStep";
import ChooseQuestionStep from "../../../../i/[token]/steps/ChooseQuestionStep";
import AnswerQuestionStep from "../../../../i/[token]/steps/AnswerQuestionStep";
import { PhotoStepForm, PhotoDropPanel } from "../../../../i/[token]/steps/PhotoStep";
import { DoneStepForm } from "../../../../i/[token]/steps/DoneStep";
import { BookTextPage, PhotoPage, MobileHero, BOOK_STYLES } from "../../../../i/[token]/SubmissionBook";
import AdjustableCoverHero from "../../../../i/[token]/AdjustableCoverHero";
import { WIZARD_EXTRA_STYLES } from "../../../../i/[token]/SubmissionWizard";
import { CONTENT, introGuidanceFor, eventTypeLabelFor, PICK_ONE_FALLBACK_TEXT } from "../../../../i/[token]/content";
import type { Lang, Question } from "../../../../i/[token]/types";
import { updateProjectGuestText, updateProjectQuestions, deleteProjectQuestion } from "../../../../../lib/actions";
import { colors } from "../../formStyles";

type ProjectQuestion = {
  id: string;
  textHe: string;
  textRu: string | null;
  textEn: string | null;
  helperTextHe: string | null;
  helperTextRu: string | null;
  helperTextEn: string | null;
};

type ProjectData = {
  id: string;
  name: string;
  eventType: string | null;
  coverImageUrl: string | null;
  coverImagePositionY: number;
  questionMode: "ALL" | "PICK_ONE";
  // The album's real, persisted "שפות הפרויקט" config (project.languages) —
  // see EditProjectForm.tsx/LanguageCheckboxes.tsx, the canonical place this
  // is edited. Drives activeLangs below and the preview-mode language toggle
  // (both here and in PreviewDeviceFrame.tsx) — this page only reflects it,
  // it doesn't own a separate editable copy anymore.
  languages: ("HE" | "RU" | "EN")[];
  guestHeadlineHe: string | null;
  guestHeadlineRu: string | null;
  guestHeadlineEn: string | null;
  introTextHe: string | null;
  introTextRu: string | null;
  introTextEn: string | null;
  blessingPromptTextHe: string | null;
  blessingPromptTextRu: string | null;
  blessingPromptTextEn: string | null;
  photoRequestTextHe: string | null;
  photoRequestTextRu: string | null;
  photoRequestTextEn: string | null;
  questions: ProjectQuestion[];
};

// A row being edited in Step 3 — id is null until the first successful save
// creates it. Kept separate from the real Question type since it also needs
// to represent an in-progress, not-yet-saved draft row.
type QuestionRow = { id: string | null; textHe: string; textRu: string; textEn: string };

// Mirrors the real PICK_ONE step order (intro → blessing → chooseQuestion →
// answerQuestion → photo → preview → done). All six are wired up as tabs
// here, but "done" is virtual — same as the real guest wizard
// (SubmissionWizard.tsx) — so it's unlabeled/uncounted below rather than
// "6 - ...".
const STEP_LABELS = [
  { id: "intro", label: "1 - הסבר" },
  { id: "blessing", label: "2 - ברכה" },
  { id: "question", label: "3 - שאלה" },
  { id: "photo", label: "4 - תמונה" },
  { id: "preview", label: "5 - תצוגה ואישור" },
  { id: "done", label: "נשלח!" },
];

// The guest-facing "step N of TOTAL" count, matching the real guest wizard's
// STEP_DISPLAY_TOTAL_PICK_ONE — "done" is a virtual, uncounted screen (shown
// once right after a real send, never numbered as its own step), so this is
// STEP_LABELS.length - 1, not STEP_LABELS.length.
const STEP_DISPLAY_TOTAL = STEP_LABELS.length - 1;

const QUESTION_PLACEHOLDER: Record<Lang, (n: number) => string> = {
  HE: (n) => `שאלה מספר ${n}`,
  RU: (n) => `Вопрос номер ${n}`,
  EN: (n) => `Question number ${n}`,
};

// Drives both the step-nav enabled state and the ‹ › quick-nav order.
// "preview" and "done" have no admin-editable content of their own (fixed
// copy / a live reflection of the guest's own answers), and "photo" edits
// its one text field directly in place in the real design — all three
// ignore the Edit/Preview mode toggle entirely and always render the same
// thing; see the render branches below.
const ACTIVE_STEPS = ["intro", "blessing", "question", "photo", "preview", "done"] as const;
type ActiveStep = (typeof ACTIVE_STEPS)[number];

const ALL_LANGS: Lang[] = ["HE", "RU", "EN"];

export default function BuildPage({ project }: { project: ProjectData }) {
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [activeStep, setActiveStep] = useState<ActiveStep>("intro");
  const [previewLang, setPreviewLang] = useState<Lang>("HE");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  // Lifted out of AdjustableCoverHero (intro tab) so the read-only hero on
  // the preview/done tabs reflects a drag immediately, without waiting for
  // updateCoverImagePosition's revalidatePath to reach a fresh page load.
  const [coverPositionY, setCoverPositionY] = useState(project.coverImagePositionY);
  // Drives activeLangs below (which columns/preview-languages show) — reads
  // the real, persisted "שפות הפרויקט" config (project.languages), edited on
  // the settings page (EditProjectForm.tsx/LanguageCheckboxes.tsx). Used to
  // be its own local, unpersisted heuristic with its own disconnected
  // checkbox UI right here; that's gone now, this just reflects the real
  // config.
  const showRu = project.languages.includes("RU");
  const showEn = project.languages.includes("EN");

  const [headline, setHeadline] = useState<Record<Lang, string>>({
    HE: project.guestHeadlineHe ?? "",
    RU: project.guestHeadlineRu ?? "",
    EN: project.guestHeadlineEn ?? "",
  });
  const [introText, setIntroText] = useState<Record<Lang, string>>({
    HE: project.introTextHe ?? "",
    RU: project.introTextRu ?? "",
    EN: project.introTextEn ?? "",
  });
  const [blessingPromptText, setBlessingPromptText] = useState<Record<Lang, string>>({
    HE: project.blessingPromptTextHe ?? "",
    RU: project.blessingPromptTextRu ?? "",
    EN: project.blessingPromptTextEn ?? "",
  });
  const [photoRequestText, setPhotoRequestText] = useState<Record<Lang, string>>({
    HE: project.photoRequestTextHe ?? "",
    RU: project.photoRequestTextRu ?? "",
    EN: project.photoRequestTextEn ?? "",
  });
  const [questions, setQuestions] = useState<QuestionRow[]>(
    project.questions.length > 0
      ? project.questions.map((q) => ({ id: q.id, textHe: q.textHe, textRu: q.textRu ?? "", textEn: q.textEn ?? "" }))
      : [{ id: null, textHe: "", textRu: "", textEn: "" }]
  );
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [questionDeleteError, setQuestionDeleteError] = useState<string | null>(null);

  // Preview-only, not persisted — lets clicking a question in the preview's
  // ChooseQuestionStep actually navigate to AnswerQuestionStep, same as a
  // real guest would, then back again. Same idea for the blessing fields:
  // genuinely typable in Preview (not disabled) so the admin can see how it
  // behaves, but nothing here is ever saved. Deliberately NOT reset when
  // switching step tabs (see changeStep below) — Step 5's preview is meant
  // to show back whatever was typed into Steps 2/3's preview, so it has to
  // survive navigating between tabs to get there.
  const [previewSubStep, setPreviewSubStep] = useState<"choose" | "answer">("choose");
  const [previewSelectedId, setPreviewSelectedId] = useState<string | null>(null);
  const [previewAnswer, setPreviewAnswer] = useState("");
  const [previewBlessingText, setPreviewBlessingText] = useState("");
  const [previewBlessingSignedBy, setPreviewBlessingSignedBy] = useState("");

  function changeStep(step: ActiveStep) {
    setActiveStep(step);
  }

  // helperText isn't editable here (not in scope / not in the sketch) — this
  // keeps the original values around so Preview mode still shows them
  // faithfully for existing questions.
  const helperById = new Map(project.questions.map((q) => [q.id, q]));

  const activeLangs = ALL_LANGS.filter((l) => l === "HE" || (l === "RU" && showRu) || (l === "EN" && showEn));

  async function handleBlur() {
    setSaveStatus("saving");
    try {
      await updateProjectGuestText(project.id, {
        guestHeadlineHe: headline.HE.trim() || null,
        guestHeadlineRu: headline.RU.trim() || null,
        guestHeadlineEn: headline.EN.trim() || null,
        introTextHe: introText.HE.trim() || null,
        introTextRu: introText.RU.trim() || null,
        introTextEn: introText.EN.trim() || null,
        blessingPromptTextHe: blessingPromptText.HE.trim() || null,
        blessingPromptTextRu: blessingPromptText.RU.trim() || null,
        blessingPromptTextEn: blessingPromptText.EN.trim() || null,
        photoRequestTextHe: photoRequestText.HE.trim() || null,
        photoRequestTextRu: photoRequestText.RU.trim() || null,
        photoRequestTextEn: photoRequestText.EN.trim() || null,
      });
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  }

  function headlineFor(lang: Lang): string {
    return headline[lang].trim() || headline.HE.trim() || project.name;
  }

  function introTextFor(lang: Lang): string {
    return introText[lang].trim() || introText.HE.trim() || CONTENT[lang].intro;
  }

  function blessingPromptTextFor(lang: Lang): string {
    return (
      blessingPromptText[lang].trim() || blessingPromptText.HE.trim() || PICK_ONE_FALLBACK_TEXT[lang].blessingPrompt
    );
  }

  function photoRequestTextFor(lang: Lang): string {
    return photoRequestText[lang].trim() || photoRequestText.HE.trim() || PICK_ONE_FALLBACK_TEXT[lang].photoRequest;
  }

  async function handleQuestionBlur() {
    setSaveStatus("saving");
    try {
      const { ids } = await updateProjectQuestions(
        project.id,
        questions.map((q) => ({ id: q.id, textHe: q.textHe, textRu: q.textRu, textEn: q.textEn }))
      );
      setQuestions((prev) => prev.map((row, i) => ({ ...row, id: ids[i] ?? row.id })));
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  }

  function addQuestionRow() {
    setQuestions((prev) => [...prev, { id: null, textHe: "", textRu: "", textEn: "" }]);
  }

  async function deleteQuestionRow(index: number) {
    const row = questions[index];
    setQuestionDeleteError(null);
    // A draft row was never saved — just drop it locally, no server round trip.
    if (!row.id) {
      setQuestions((prev) => prev.filter((_, i) => i !== index));
      return;
    }
    const result = await deleteProjectQuestion(project.id, row.id);
    if (result.ok) {
      setQuestions((prev) => prev.filter((_, i) => i !== index));
    } else {
      setQuestionDeleteError(result.error);
    }
  }

  function updateQuestionRow(index: number, lang: Lang, value: string) {
    setQuestions((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [lang === "HE" ? "textHe" : lang === "RU" ? "textRu" : "textEn"]: value } : row))
    );
  }

  // Real Question[] shape for the Preview components — pulls helperText from
  // the original loaded data (untouched by this editor). A question shows up
  // in Preview the moment it's added, even before any text is typed, with a
  // "Question number N" placeholder per language so the list never looks
  // broken/blank while the admin is still writing it.
  const previewQuestionList: Question[] = questions.map((q, i) => {
    const original = q.id ? helperById.get(q.id) : undefined;
    return {
      id: q.id ?? `draft-${i}`,
      textHe: q.textHe.trim() || QUESTION_PLACEHOLDER.HE(i + 1),
      textRu: q.textRu.trim() || QUESTION_PLACEHOLDER.RU(i + 1),
      textEn: q.textEn.trim() || QUESTION_PLACEHOLDER.EN(i + 1),
      helperTextHe: original?.helperTextHe ?? undefined,
      helperTextRu: original?.helperTextRu ?? undefined,
      helperTextEn: original?.helperTextEn ?? undefined,
      existingAnswer: "",
    };
  });
  const previewSelectedQuestion =
    previewQuestionList.find((q) => q.id === previewSelectedId) ?? (previewSubStep === "answer" ? previewQuestionList[0] : undefined);

  const eyebrowCaption = project.eventType ? `אלבום מתנה (${project.eventType})` : "אלבום מתנה";
  const guidanceMap = introGuidanceFor(project.questionMode);

  return (
    <main>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: colors.textPrimary, margin: "0 0 4px" }}>
          עריכת טופס עבור משתמשים
        </h1>
        <p style={{ fontSize: 16, fontWeight: 600, color: colors.textSecondary, margin: 0 }}>עריכת פרויקט</p>
      </div>
      <hr style={{ border: "none", borderTop: `1px solid ${colors.border}`, margin: "0 0 20px" }} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <span style={{ fontSize: 12, minWidth: 60, color: saveStatus === "error" ? "#b00020" : colors.textLabel }}>
            {saveStatus === "saving" && "שומר..."}
            {saveStatus === "saved" && "נשמר"}
            {saveStatus === "error" && "שגיאת שמירה"}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        {/* Edit/Preview as a single two-segment toggle (one track, one
            active fill) instead of two separate pill buttons — sits in the
            same centered row as the step tabs and (in Preview mode) the
            language toggle, instead of separate rows above. */}
        <div style={{ display: "inline-flex", padding: 3, borderRadius: 999, background: "#f1efe9", border: `1px solid ${colors.border}`, flexShrink: 0 }}>
          <button type="button" onClick={() => setMode("edit")} style={toggleSegmentStyle(mode === "edit")}>
            עריכה
          </button>
          <button type="button" onClick={() => setMode("preview")} style={toggleSegmentStyle(mode === "preview")}>
            תצוגה מקדימה
          </button>
        </div>
        <div style={{ width: 1, alignSelf: "stretch", background: colors.border, flexShrink: 0 }} />
        {STEP_LABELS.map((step) => {
          const isActive = step.id === activeStep;
          const isEnabled = (ACTIVE_STEPS as readonly string[]).includes(step.id);
          return (
            <button
              key={step.id}
              type="button"
              disabled={!isEnabled}
              onClick={() => isEnabled && changeStep(step.id as ActiveStep)}
              style={{
                padding: "8px 16px",
                fontSize: 12,
                fontWeight: 700,
                borderRadius: 999,
                border: `1px solid ${colors.border}`,
                background: isActive ? colors.buttonDark : "white",
                color: isActive ? "white" : colors.textLabel,
                cursor: isEnabled ? "pointer" : "default",
              }}
            >
              שלב {step.label}
            </button>
          );
        })}

        {/* Language toggle only in Preview mode, same as steps 1-3's
            language pills used to be — steps 4-6 render the exact same
            content in both modes, so there's nothing extra to gain from
            showing it while in Edit mode specifically. */}
        {mode === "preview" && (
          <>
            <div style={{ width: 1, alignSelf: "stretch", background: colors.border, flexShrink: 0 }} />
            <div style={{ display: "inline-flex", padding: 3, borderRadius: 999, background: "#f1efe9", border: `1px solid ${colors.border}`, flexShrink: 0 }}>
              {activeLangs.map((l) => (
                <button key={l} type="button" onClick={() => setPreviewLang(l)} style={toggleSegmentStyle(previewLang === l)}>
                  {l}
                </button>
              ))}
            </div>
            <div style={{ width: 1, alignSelf: "stretch", background: colors.border, flexShrink: 0 }} />
            <div style={{ display: "inline-flex", padding: 3, borderRadius: 999, background: "#f1efe9", border: `1px solid ${colors.border}`, flexShrink: 0 }}>
              <button type="button" onClick={() => setDevice("desktop")} style={toggleSegmentStyle(device === "desktop")} aria-label="תצוגת דסקטופ">
                <DesktopIcon />
              </button>
              <button type="button" onClick={() => setDevice("mobile")} style={toggleSegmentStyle(device === "mobile")} aria-label="תצוגת מובייל">
                <MobileIcon />
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`${BOOK_STYLES}${WIZARD_EXTRA_STYLES}
        .build-field-caption { font-size: 12px; color: ${colors.guidanceOrange}; font-weight: 600; margin: 14px 0 6px; }
        .build-field-box { border: 1px solid #f0c419; background: #fdf6d8; border-radius: 8px; }
        .build-field-box textarea, .build-field-box input {
          width: 100%; border: none; background: transparent; font: inherit;
          padding: 10px 12px; box-sizing: border-box; resize: vertical; color: ${colors.textPrimary};
        }
        .build-field-box textarea:focus, .build-field-box input:focus { outline: 2px solid #f0c419; border-radius: 6px; }
        /* Admin-side variant of the "Eyebrow" text token (the small label
           above each step's content) — the guest-facing equivalent is
           .sub-eyebrow in WIZARD_EXTRA_STYLES (13px, purple). This one stays
           small/gray to match the rest of the admin UI. */
        .build-lang-column-heading { font-size: 12px; font-weight: 700; color: ${colors.textLabel}; margin: 0 0 4px; }
      `}</style>

      <div className="sub-book-outer" style={mode === "preview" && device === "mobile" ? { maxWidth: 420, margin: "0 auto" } : undefined}>
        {/* Mobile-only hero banner (see .sub-mobile-hero) — same 3 "bookend"
            steps as the real guest wizard (SubmissionWizard.tsx): intro,
            preview, done. There's no real guest photo in this generic
            template preview, so it's always the project's cover photo. */}
        {/* Draggable only on intro — it's the same cover photo/position on
            preview and done too (there's no real guest photo in this generic
            preview), but a single editable place avoids three drag handles
            fighting over the same value. */}
        {activeStep === "intro" && (
          <AdjustableCoverHero
            projectId={project.id}
            src={project.coverImageUrl}
            initialPositionY={coverPositionY}
            onPositionChange={setCoverPositionY}
          />
        )}
        {(activeStep === "preview" || activeStep === "done") && (
          <MobileHero src={project.coverImageUrl} positionY={coverPositionY} />
        )}
        <div className="sub-book" style={{ minHeight: 420 }}>
          {activeStep === "preview" ? (
            // No admin-editable fields for this step (it just reflects
            // whatever the real guest will have written in Blessing/
            // Question), so unlike the other steps it renders the exact same
            // generic template in both Edit and Preview mode — this branch
            // is checked before the mode ternary below, so mode never
            // affects it. isAdminPreview swaps in placeholder body text for
            // every section instead of these (unused) real values.
            // Uses BookTextPage (not the full SubmissionBook) because this
            // outer .sub-book already supplies its own spine + cover photo
            // below, same as every other step here — the full SubmissionBook
            // brings its own, which nested inside this one and produced a
            // stray extra photo-placeholder column.
            <BookTextPage
              content={CONTENT}
              lang={previewLang}
              answers={{}}
              questions={previewQuestionList}
              dateLocation=""
              blessingText={null}
              blessingSignedBy={null}
              onBackToEdit={() => {}}
              onConfirm={() => {}}
              isSubmitting={false}
              error={null}
              stepNumber={5}
              stepTotal={STEP_DISPLAY_TOTAL}
              isAdminPreview
            />
          ) : activeStep === "photo" ? (
            // Same idea as "preview" above: no separate raw-textarea Edit
            // screen — the real PhotoStepForm design renders identically in
            // both modes, with its subtext directly editable in place
            // (styled like the other "genuinely open for writing" fields)
            // instead of a disconnected admin-only form. Paired with
            // PhotoDropPanel below instead of this outer shell's usual
            // trailing PhotoPage — see the comment down there.
            <PhotoStepForm
              lang={previewLang}
              photoRequestText={mode === "edit" ? photoRequestText[previewLang] : photoRequestTextFor(previewLang)}
              photoRequestTextPlaceholder={photoRequestTextFor(previewLang)}
              onPhotoRequestTextChange={
                mode === "edit" ? (value) => setPhotoRequestText((prev) => ({ ...prev, [previewLang]: value })) : undefined
              }
              onPhotoRequestTextBlur={mode === "edit" ? handleBlur : undefined}
              onPhotoChange={() => {}}
              onBack={() => {}}
              onNext={() => {}}
              isSaving={false}
              error={null}
              stepNumber={4}
              stepTotal={STEP_DISPLAY_TOTAL}
              photoPreviewUrl={null}
            />
          ) : activeStep === "done" ? (
            // Same idea as "preview"/"photo" above: fixed, non-editable copy
            // (nothing guest- or project-specific to show on a "your
            // submission was received" screen), so it renders identically in
            // both modes. No onBackToEdit here — there's no real in-progress
            // submission behind this generic preview to go back to.
            <DoneStepForm lang={previewLang} stepNumber={STEP_DISPLAY_TOTAL} stepTotal={STEP_DISPLAY_TOTAL} />
          ) : mode === "preview" ? (
            activeStep === "intro" ? (
              <IntroStep
                lang={previewLang}
                projectName={headlineFor(previewLang)}
                c={CONTENT[previewLang]}
                eventTypeLabel={eventTypeLabelFor(project.eventType, previewLang)}
                introText={introTextFor(previewLang)}
                guidance={guidanceMap[previewLang]}
                stepNumber={1}
                stepTotal={STEP_DISPLAY_TOTAL}
                onStart={() => {}}
              />
            ) : activeStep === "blessing" ? (
              <BlessingStep
                lang={previewLang}
                c={CONTENT[previewLang]}
                blessingText={previewBlessingText}
                blessingSignedBy={previewBlessingSignedBy}
                blessingPromptText={blessingPromptTextFor(previewLang)}
                onBlessingTextChange={setPreviewBlessingText}
                onBlessingSignedByChange={setPreviewBlessingSignedBy}
                onBack={() => {}}
                onNext={() => {}}
                isSaving={false}
                error={null}
                stepNumber={2}
                stepTotal={STEP_DISPLAY_TOTAL}
              />
            ) : previewSubStep === "choose" || !previewSelectedQuestion ? (
              <ChooseQuestionStep
                questions={previewQuestionList}
                lang={previewLang}
                c={CONTENT[previewLang]}
                selectedId={previewSelectedId}
                onChoose={(id) => {
                  setPreviewSelectedId(id);
                  setPreviewSubStep("answer");
                }}
                onBack={() => {}}
                stepNumber={3}
                stepTotal={STEP_DISPLAY_TOTAL}
              />
            ) : (
              <AnswerQuestionStep
                question={previewSelectedQuestion}
                lang={previewLang}
                c={CONTENT[previewLang]}
                answer={previewAnswer}
                onAnswerChange={setPreviewAnswer}
                onBack={() => setPreviewSubStep("choose")}
                onNext={() => {}}
                isSaving={false}
                error={null}
                stepNumber={3}
                stepTotal={STEP_DISPLAY_TOTAL}
              />
            )
          ) : activeStep === "question" ? (
            // Row-major grid (unlike intro/blessing below): one shared trash
            // icon per question, in its own gutter column spanning across
            // whichever language columns are active — not duplicated per
            // language, and not crammed inside any one column's caption row.
            <div
              className="sub-page sub-page-form"
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${activeLangs.length}, 1fr) 40px`,
                gap: 24,
                padding: "36px 32px",
                overflowY: "auto",
                alignItems: "start",
              }}
            >
              {questions.map((row, i) => (
                <Fragment key={row.id ?? `draft-${i}`}>
                  {activeLangs.map((lang) => (
                    <div key={lang}>
                      {i === 0 && <p className="build-lang-column-heading">שאלות למוזמנים</p>}
                      <p className="build-field-caption" style={{ marginTop: i === 0 ? 0 : 14 }}>
                        שאלה {i + 1}
                      </p>
                      <div className="build-field-box">
                        <textarea
                          rows={2}
                          value={lang === "HE" ? row.textHe : lang === "RU" ? row.textRu : row.textEn}
                          placeholder="לחצי כדי להוסיף טקסט..."
                          onChange={(e) => updateQuestionRow(i, lang, e.target.value)}
                          onBlur={handleQuestionBlur}
                          style={{ direction: lang === "HE" ? "rtl" : "ltr", textAlign: lang === "HE" ? "right" : "left" }}
                        />
                      </div>
                    </div>
                  ))}
                  <div style={{ alignSelf: "center" }}>
                    <button type="button" aria-label="מחיקת שאלה" onClick={() => deleteQuestionRow(i)} style={trashButtonStyle}>
                      <TrashIcon />
                    </button>
                  </div>
                </Fragment>
              ))}

              {questionDeleteError && (
                <p style={{ fontSize: 12, color: "#b00020", margin: 0, gridColumn: `1 / span ${activeLangs.length + 1}` }}>
                  {questionDeleteError}
                </p>
              )}

              <button
                type="button"
                onClick={addQuestionRow}
                style={{ ...addQuestionButtonStyle, gridColumn: `1 / span ${activeLangs.length + 1}` }}
              >
                <PlusCircleIcon />
                הוספת שאלה חדשה
              </button>
            </div>
          ) : (
            <div
              className="sub-page sub-page-form"
              style={{ display: "grid", gridTemplateColumns: `repeat(${activeLangs.length}, 1fr)`, gap: 24, padding: "36px 32px", overflowY: "auto" }}
            >
              {activeLangs.map((lang) => (
                <div key={lang}>
                  <p className="build-lang-column-heading">
                    {activeStep === "intro" ? `${eyebrowCaption} · ${lang}` : "ברכה"}
                  </p>

                  {activeStep === "intro" ? (
                    <>
                      <p className="build-field-caption" style={{ marginTop: 0 }}>
                        כותרת:
                      </p>
                      <div className="build-field-box">
                        <input
                          value={headline[lang]}
                          placeholder={project.name}
                          onChange={(e) => setHeadline((prev) => ({ ...prev, [lang]: e.target.value }))}
                          onBlur={handleBlur}
                          style={{ direction: lang === "HE" ? "rtl" : "ltr", textAlign: lang === "HE" ? "right" : "left" }}
                        />
                      </div>

                      <p className="build-field-caption">טקסט פתיחה למוזמנים:</p>
                      <div className="build-field-box">
                        <textarea
                          rows={4}
                          value={introText[lang]}
                          placeholder="לחצי כדי להוסיף טקסט..."
                          onChange={(e) => setIntroText((prev) => ({ ...prev, [lang]: e.target.value }))}
                          onBlur={handleBlur}
                          style={{ direction: lang === "HE" ? "rtl" : "ltr", textAlign: lang === "HE" ? "right" : "left" }}
                        />
                      </div>

                      {/* RU/EN need dir="ltr" explicitly — this grid has no
                          ambient per-column direction of its own (unlike the
                          real IntroStep), so without it padding-inline-start
                          on the list below resolves backwards under the
                          page's RTL context and glues the text to the left
                          edge with no indent. */}
                      <div className="sub-intro-guidance" dir={lang === "HE" ? "rtl" : "ltr"}>
                        <p className="sub-intro-guidance-heading">{guidanceMap[lang].stepsHeading}</p>
                        <ol className="sub-intro-guidance-steps">
                          {guidanceMap[lang].steps.map((step, i) => (
                            <li key={i}>
                              <strong>{step.title}:</strong> {step.body}
                            </li>
                          ))}
                        </ol>
                        <p className="sub-intro-guidance-heading">{guidanceMap[lang].closingHeading}</p>
                        <p className="sub-intro-guidance-closing">{guidanceMap[lang].closingBody}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="build-field-caption" style={{ marginTop: 0 }}>
                        טקסט הנחיה לברכה
                      </p>
                      <div className="build-field-box">
                        <textarea
                          rows={4}
                          value={blessingPromptText[lang]}
                          placeholder="לחצי כדי להוסיף טקסט..."
                          onChange={(e) => setBlessingPromptText((prev) => ({ ...prev, [lang]: e.target.value }))}
                          onBlur={handleBlur}
                          style={{ direction: lang === "HE" ? "rtl" : "ltr", textAlign: lang === "HE" ? "right" : "left" }}
                        />
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="sub-spine" />
          {activeStep === "photo" || activeStep === "blessing" || activeStep === "question" ? (
            // The real drop-zone look (40%-opacity cover-photo backdrop +
            // "add photo" button) instead of this shell's usual plain
            // PhotoPage — matches the real guest wizard, where steps 2-4 all
            // show this same "add a photo" invitation.
            <PhotoDropPanel
              lang={previewLang}
              photoPreviewUrl={null}
              coverImageUrl={project.coverImageUrl}
              onPhotoChange={() => {}}
            />
          ) : (
            <PhotoPage photoUrl={project.coverImageUrl} />
          )}
        </div>
      </div>

      <p style={{ fontSize: 12, color: colors.textLabel, marginTop: 16 }}>
        כל 6 השלבים זמינים לצפייה. שלבי ההסבר, הברכה, השאלות והתמונה ניתנים לעריכה — שלבי התצוגה המקדימה וההודעה על
        שליחה מוצלחת הם טקסט קבוע ומשקפים אוטומטית את מה שהמוזמן/ת יזינו.
      </p>
    </main>
  );
}

function toggleSegmentStyle(active: boolean): React.CSSProperties {
  return {
    padding: "6px 14px",
    fontSize: 12,
    fontWeight: 700,
    borderRadius: 999,
    border: "none",
    background: active ? colors.buttonDark : "transparent",
    color: active ? "white" : colors.textLabel,
    cursor: "pointer",
  };
}

const addQuestionButtonStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 0",
  fontSize: 14,
  fontWeight: 700,
  color: "white",
  background: colors.guidanceOrange,
  border: "none",
  borderRadius: 10,
  cursor: "pointer",
  marginTop: 4,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};

function PlusCircleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8.5" stroke="white" strokeWidth="1.4" />
      <path d="M10 6v8M6 10h8" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

const trashButtonStyle: React.CSSProperties = {
  width: 26,
  height: 26,
  flexShrink: 0,
  padding: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "none",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  color: colors.textLabel,
};

function DesktopIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="3.5" width="16" height="10.5" rx="1.3" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7 17h6M10 14v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function MobileIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <rect x="5.5" y="2" width="9" height="16" rx="1.6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9 15.3h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <path
        d="M4 6h12M8 6V4.5c0-.6.4-1 1-1h2c.6 0 1 .4 1 1V6m-7 0 .7 9.3c.05.7.6 1.2 1.3 1.2h5.6c.7 0 1.25-.5 1.3-1.2L15 6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
