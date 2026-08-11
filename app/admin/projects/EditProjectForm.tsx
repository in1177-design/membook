"use client";

import { useState } from "react";
import { updateProjectDetails } from "../../../lib/actions";
import CoverImageUpload from "./CoverImageUpload";
import EventTypeSelect from "./EventTypeSelect";
import IntroTextBuilder from "./IntroTextBuilder";
import QuestionsBuilder from "./QuestionsBuilder";
import QuestionModeSelect from "./QuestionModeSelect";
import LanguageCheckboxes from "./LanguageCheckboxes";
import { celebrantLabelFor } from "./eventTypeEmoji";
import { colors, labelStyle, sectionHeaderStyle, inputStyle, ltrInputStyle, rowStyle, buttonStyle, dividerStyle, cardStyle } from "./formStyles";

type Props = {
  project: {
    id: string;
    name: string;
    celebrantNames: string | null;
    customerName: string | null;
    customerPhone: string | null;
    eventType: string | null;
    eventDate: Date | null;
    submissionDeadline: Date | null;
    notes: string | null;
    coverImageUrl: string | null;
    questionMode: "ALL" | "PICK_ONE";
    // Real, persisted "שפות הפרויקט" config (LanguageCheckboxes.tsx) — HE is
    // always included. Drives which languages an invitee can be assigned;
    // see InviteesTable.tsx's enabledLanguages prop.
    languages: ("HE" | "RU" | "EN")[];
    introTextHe: string | null;
    introTextRu: string | null;
    introTextEn: string | null;
    photoRequestTextHe: string | null;
    photoRequestTextRu: string | null;
    photoRequestTextEn: string | null;
    blessingPromptTextHe: string | null;
    blessingPromptTextRu: string | null;
    blessingPromptTextEn: string | null;
    whatsappTemplateHe: string | null;
    whatsappTemplateRu: string | null;
    whatsappTemplateEn: string | null;
    emailSubjectTemplateHe: string | null;
    emailSubjectTemplateRu: string | null;
    emailSubjectTemplateEn: string | null;
    emailBodyTemplateHe: string | null;
    emailBodyTemplateRu: string | null;
    emailBodyTemplateEn: string | null;
    questions: {
      id: string;
      textHe: string;
      textRu: string | null;
      textEn: string | null;
      helperTextHe: string | null;
      helperTextRu: string | null;
      helperTextEn: string | null;
    }[];
  };
  eventTypeOptions: string[];
  questionTemplates: { id: string; textHe: string; helperTextHe: string | null }[];
  introTemplates: { id: string; label: string; textHe: string }[];
  onSaved: () => void;
  readOnly?: boolean;
};

function toDateInputValue(date: Date | null): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

// The materials-collection deadline defaults to 3 weeks before the event, computed
// in UTC to avoid local-timezone date-shift issues with plain YYYY-MM-DD strings.
function computeDeadline(eventDateStr: string): string {
  const [y, m, d] = eventDateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() - 21);
  return date.toISOString().slice(0, 10);
}

const BLESSING_PROMPT_DEFAULT = "כמה מילים לברכה...";

// Default starting text for the message template fields (see below) — real,
// editable textarea/input content (via defaultValue), not a vanishing
// placeholder hint, so it's actually there to keep/tweak/save. Only used as
// a fallback while the project has no saved value yet; once saved, the real
// value always wins over this. {{guest_name}}/{{celebrant_names}}/
// {{personal_link}} are the three supported substitution tokens; a real
// send feature (not built yet) would replace them per guest.
const WHATSAPP_TEMPLATE_DEFAULT_HE = `היי {{guest_name}},

אנחנו מכינים ל{{celebrant_names}} אלבום מיוחד לכבוד חתונת הזהב שלהם, ונשמח שתיקחו בו חלק.

בקישור האישי שלכם תוכלו להוסיף ברכה, זיכרון ותמונה:
{{personal_link}}`;

const WHATSAPP_TEMPLATE_DEFAULT_RU = `Привет, {{guest_name}},

Мы готовим для {{celebrant_names}} особый альбом в честь их золотой свадьбы, и будем рады, если вы примете в этом участие.

По вашей личной ссылке вы сможете добавить пожелание, воспоминание и фото:
{{personal_link}}`;

const WHATSAPP_TEMPLATE_DEFAULT_EN = `Hi {{guest_name}},

We're putting together a special album for {{celebrant_names}} to celebrate their golden wedding anniversary, and we'd love for you to be part of it.

Using your personal link, you can add a blessing, a memory, and a photo:
{{personal_link}}`;

const EMAIL_SUBJECT_TEMPLATE_DEFAULT_HE = `הזמנה להשתתף באלבום לכבוד {{celebrant_names}}`;
const EMAIL_SUBJECT_TEMPLATE_DEFAULT_RU = `Приглашение принять участие в альбоме для {{celebrant_names}}`;
const EMAIL_SUBJECT_TEMPLATE_DEFAULT_EN = `Invitation to contribute to {{celebrant_names}}'s album`;

const EMAIL_BODY_TEMPLATE_DEFAULT_HE = `היי {{guest_name}},

אנחנו מכינים ל{{celebrant_names}} אלבום זיכרונות מיוחד, ונשמח שתיקחו בו חלק.

בקישור האישי שלכם תוכלו להוסיף ברכה, זיכרון ותמונה:
{{personal_link}}`;

const EMAIL_BODY_TEMPLATE_DEFAULT_RU = `Привет, {{guest_name}},

Мы готовим для {{celebrant_names}} особый альбом воспоминаний, и будем рады, если вы примете в этом участие.

По вашей личной ссылке вы сможете добавить пожелание, воспоминание и фото:
{{personal_link}}`;

const EMAIL_BODY_TEMPLATE_DEFAULT_EN = `Hi {{guest_name}},

We're putting together a special memory album for {{celebrant_names}}, and we'd love for you to be part of it.

Using your personal link, you can add a blessing, a memory, and a photo:
{{personal_link}}`;

export default function EditProjectForm({ project, eventTypeOptions, questionTemplates, introTemplates, onSaved, readOnly }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [questionMode, setQuestionMode] = useState<"ALL" | "PICK_ONE">(project.questionMode);
  const [eventType, setEventType] = useState(project.eventType ?? "");
  // Real, persisted source of truth now (project.languages) — previously this
  // was inferred from whether any Ru/En text happened to exist anywhere on
  // the project, which was never actually saved. See LanguageCheckboxes.tsx
  // and updateProjectDetails's `languages` handling in lib/actions.ts.
  const [showRu, setShowRu] = useState(project.languages.includes("RU"));
  const [showEn, setShowEn] = useState(project.languages.includes("EN"));

  const [eventDate, setEventDate] = useState(toDateInputValue(project.eventDate));
  const [submissionDeadline, setSubmissionDeadline] = useState(toDateInputValue(project.submissionDeadline));
  const [deadlineTouched, setDeadlineTouched] = useState(false);

  function handleEventDateChange(value: string) {
    setEventDate(value);
    if (!deadlineTouched && value) {
      setSubmissionDeadline(computeDeadline(value));
    }
  }

  function handleDeadlineChange(value: string) {
    setDeadlineTouched(true);
    setSubmissionDeadline(value);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await updateProjectDetails(project.id, new FormData(e.currentTarget));
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "משהו השתבש, נסי שוב");
      setSubmitting(false);
    }
  }

  const pickOneColumnCount = 1 + (showRu ? 1 : 0) + (showEn ? 1 : 0);

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 20 }}>
      {/* Card 1: פרטי הפרויקט — same card treatment as the "מוזמנים" table
          (see formStyles' cardStyle), grouping the main details form with
          the question-mode/languages row that used to sit below its own
          <hr>. */}
      <div style={{ ...cardStyle, display: "grid", gap: 20 }}>
      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <h3 style={sectionHeaderStyle}>פרטי הראשיים</h3>
          <div style={{ width: 240 }}>
            <span style={labelStyle}>סוג האירוע</span>
            <EventTypeSelect options={eventTypeOptions} initialValue={project.eventType ?? ""} onValueChange={setEventType} readOnly={readOnly} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 16, alignItems: "start" }}>
          <CoverImageUpload initialUrl={project.coverImageUrl} readOnly={readOnly} />
          <div style={{ display: "grid", gap: 16 }}>
            <div style={rowStyle}>
              <label>
                <span style={labelStyle}>שם הפרויקט</span>
                <input name="name" defaultValue={project.name} required disabled={readOnly} style={inputStyle} />
              </label>
              <label>
                <span style={labelStyle}>{celebrantLabelFor(eventType)}</span>
                <input name="celebrantNames" defaultValue={project.celebrantNames ?? ""} disabled={readOnly} style={inputStyle} />
              </label>
            </div>

            <div style={rowStyle}>
              <label>
                <span style={labelStyle}>שם הלקוח</span>
                <input name="customerName" defaultValue={project.customerName ?? ""} disabled={readOnly} style={inputStyle} />
              </label>
              <label>
                <span style={labelStyle}>טלפון הלקוח</span>
                <input name="customerPhone" defaultValue={project.customerPhone ?? ""} disabled={readOnly} style={inputStyle} />
              </label>
            </div>

            <div style={rowStyle}>
              <label>
                <span style={labelStyle}>תאריך האירוע</span>
                <input
                  name="eventDate"
                  type="date"
                  value={eventDate}
                  disabled={readOnly}
                  onChange={(e) => handleEventDateChange(e.target.value)}
                  style={inputStyle}
                />
              </label>
              <label>
                <span style={labelStyle}>תאריך סיום איסוף חומרים</span>
                <input
                  name="submissionDeadline"
                  type="date"
                  value={submissionDeadline}
                  disabled={readOnly}
                  onChange={(e) => handleDeadlineChange(e.target.value)}
                  style={inputStyle}
                />
              </label>
            </div>
          </div>
        </div>

        <label>
          <span style={labelStyle}>הערות פנימיות</span>
          <textarea
            name="notes"
            defaultValue={project.notes ?? ""}
            placeholder="לא מוצג למוזמנים"
            rows={3}
            disabled={readOnly}
            style={{ ...inputStyle, resize: "vertical", minHeight: 80 }}
          />
        </label>
      </div>

      <hr style={dividerStyle} />

      <div style={{ display: "flex", gap: 28, alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <QuestionModeSelect value={questionMode} onChange={setQuestionMode} readOnly={readOnly} />
        </div>
        <div style={{ flex: 1 }}>
          <LanguageCheckboxes showRu={showRu} showEn={showEn} onChangeRu={setShowRu} onChangeEn={setShowEn} readOnly={readOnly} />
        </div>
      </div>
      </div>

      {/* Card 2: טקסטים — the intro text, questions, and (PICK_ONE only)
          blessing-prompt/photo-request text builders, grouped together. */}
      <div style={{ ...cardStyle, display: "grid", gap: 24 }}>
      <IntroTextBuilder
        templates={introTemplates}
        initialText={project.introTextHe ?? ""}
        initialTextRu={project.introTextRu ?? ""}
        initialTextEn={project.introTextEn ?? ""}
        showRu={showRu}
        showEn={showEn}
        readOnly={readOnly}
      />

      <hr style={dividerStyle} />

      <QuestionsBuilder
        templates={questionTemplates}
        existingQuestions={project.questions}
        showRu={showRu}
        showEn={showEn}
        readOnly={readOnly}
      />

      {questionMode === "PICK_ONE" && (
        <>
          <hr style={dividerStyle} />
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <h3 style={sectionHeaderStyle}>טקסט הנחיה לברכה</h3>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${pickOneColumnCount}, 1fr)`, gap: 16 }}>
              <label>
                <span style={labelStyle}>עברית</span>
                <textarea
                  name="blessingPromptTextHe"
                  defaultValue={project.blessingPromptTextHe ?? ""}
                  placeholder={BLESSING_PROMPT_DEFAULT}
                  rows={2}
                  disabled={readOnly}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </label>
              <label style={{ display: showRu ? "block" : "none" }}>
                <span style={labelStyle}>רוסית</span>
                <textarea
                  name="blessingPromptTextRu"
                  defaultValue={project.blessingPromptTextRu ?? ""}
                  rows={2}
                  disabled={readOnly}
                  style={{ ...ltrInputStyle, resize: "vertical" }}
                />
              </label>
              <label style={{ display: showEn ? "block" : "none" }}>
                <span style={labelStyle}>אנגלית</span>
                <textarea
                  name="blessingPromptTextEn"
                  defaultValue={project.blessingPromptTextEn ?? ""}
                  rows={2}
                  disabled={readOnly}
                  style={{ ...ltrInputStyle, resize: "vertical" }}
                />
              </label>
            </div>
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <h3 style={sectionHeaderStyle}>טקסט בקשת התמונה</h3>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${pickOneColumnCount}, 1fr)`, gap: 16 }}>
              <label>
                <span style={labelStyle}>עברית</span>
                <textarea name="photoRequestTextHe" defaultValue={project.photoRequestTextHe ?? ""} rows={3} disabled={readOnly} style={{ ...inputStyle, resize: "vertical" }} />
              </label>
              <label style={{ display: showRu ? "block" : "none" }}>
                <span style={labelStyle}>רוסית</span>
                <textarea name="photoRequestTextRu" defaultValue={project.photoRequestTextRu ?? ""} rows={3} disabled={readOnly} style={{ ...ltrInputStyle, resize: "vertical" }} />
              </label>
              <label style={{ display: showEn ? "block" : "none" }}>
                <span style={labelStyle}>אנגלית</span>
                <textarea name="photoRequestTextEn" defaultValue={project.photoRequestTextEn ?? ""} rows={3} disabled={readOnly} style={{ ...ltrInputStyle, resize: "vertical" }} />
              </label>
            </div>
          </div>
        </>
      )}
      </div>

      {/* Card 3: בניית הודעות לאורחים */}
      <div style={{ ...cardStyle, display: "grid", gap: 16 }}>
        <div style={{ display: "grid", gap: 4 }}>
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <h3 style={sectionHeaderStyle}>הודעות לאורחים</h3>
          </div>
          <p style={{ fontSize: 12, color: colors.textSecondary, margin: 0 }}>
            ניתן להשתמש בתגיות הבאות בתוך ההודעות — הן יוחלפו בפועל בזמן השליחה (טרם קיימת):{" "}
            <code>{"{{guest_name}}"}</code> (שם המוזמן/ת), <code>{"{{celebrant_names}}"}</code> (שם/שמות
            החוגגים), <code>{"{{personal_link}}"}</code> (הקישור האישי שלו/ה).
          </p>
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <span style={labelStyle}>הודעת וואטסאפ</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${pickOneColumnCount}, 1fr)`, gap: 16 }}>
            <label>
              <span style={labelStyle}>עברית</span>
              <textarea
                name="whatsappTemplateHe"
                defaultValue={project.whatsappTemplateHe ?? WHATSAPP_TEMPLATE_DEFAULT_HE}
                rows={6}
                disabled={readOnly}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </label>
            <label style={{ display: showRu ? "block" : "none" }}>
              <span style={labelStyle}>רוסית</span>
              <textarea
                name="whatsappTemplateRu"
                defaultValue={project.whatsappTemplateRu ?? WHATSAPP_TEMPLATE_DEFAULT_RU}
                rows={6}
                disabled={readOnly}
                style={{ ...ltrInputStyle, resize: "vertical" }}
              />
            </label>
            <label style={{ display: showEn ? "block" : "none" }}>
              <span style={labelStyle}>אנגלית</span>
              <textarea
                name="whatsappTemplateEn"
                defaultValue={project.whatsappTemplateEn ?? WHATSAPP_TEMPLATE_DEFAULT_EN}
                rows={6}
                disabled={readOnly}
                style={{ ...ltrInputStyle, resize: "vertical" }}
              />
            </label>
          </div>
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <span style={labelStyle}>נושא המייל</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${pickOneColumnCount}, 1fr)`, gap: 16 }}>
            <label>
              <span style={labelStyle}>עברית</span>
              <input
                name="emailSubjectTemplateHe"
                defaultValue={project.emailSubjectTemplateHe ?? EMAIL_SUBJECT_TEMPLATE_DEFAULT_HE}
                disabled={readOnly}
                style={inputStyle}
              />
            </label>
            <label style={{ display: showRu ? "block" : "none" }}>
              <span style={labelStyle}>רוסית</span>
              <input
                name="emailSubjectTemplateRu"
                defaultValue={project.emailSubjectTemplateRu ?? EMAIL_SUBJECT_TEMPLATE_DEFAULT_RU}
                disabled={readOnly}
                style={ltrInputStyle}
              />
            </label>
            <label style={{ display: showEn ? "block" : "none" }}>
              <span style={labelStyle}>אנגלית</span>
              <input
                name="emailSubjectTemplateEn"
                defaultValue={project.emailSubjectTemplateEn ?? EMAIL_SUBJECT_TEMPLATE_DEFAULT_EN}
                disabled={readOnly}
                style={ltrInputStyle}
              />
            </label>
          </div>
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <span style={labelStyle}>גוף המייל</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${pickOneColumnCount}, 1fr)`, gap: 16 }}>
            <label>
              <span style={labelStyle}>עברית</span>
              <textarea
                name="emailBodyTemplateHe"
                defaultValue={project.emailBodyTemplateHe ?? EMAIL_BODY_TEMPLATE_DEFAULT_HE}
                rows={6}
                disabled={readOnly}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </label>
            <label style={{ display: showRu ? "block" : "none" }}>
              <span style={labelStyle}>רוסית</span>
              <textarea
                name="emailBodyTemplateRu"
                defaultValue={project.emailBodyTemplateRu ?? EMAIL_BODY_TEMPLATE_DEFAULT_RU}
                rows={6}
                disabled={readOnly}
                style={{ ...ltrInputStyle, resize: "vertical" }}
              />
            </label>
            <label style={{ display: showEn ? "block" : "none" }}>
              <span style={labelStyle}>אנגלית</span>
              <textarea
                name="emailBodyTemplateEn"
                defaultValue={project.emailBodyTemplateEn ?? EMAIL_BODY_TEMPLATE_DEFAULT_EN}
                rows={6}
                disabled={readOnly}
                style={{ ...ltrInputStyle, resize: "vertical" }}
              />
            </label>
          </div>
        </div>
      </div>

      {!readOnly && (
        <>
          <hr style={dividerStyle} />

          {error && <p style={{ color: "#b00020", fontSize: 14 }}>{error}</p>}

          <button type="submit" disabled={submitting} style={{ ...buttonStyle, opacity: submitting ? 0.7 : 1 }}>
            {submitting ? "שומר..." : "שמירה"}
          </button>
        </>
      )}
    </form>
  );
}
