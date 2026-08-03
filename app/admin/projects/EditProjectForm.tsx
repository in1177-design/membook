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
import { labelStyle, sectionHeaderStyle, inputStyle, ltrInputStyle, rowStyle, buttonStyle, dividerStyle } from "./formStyles";

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
    introTextHe: string | null;
    introTextRu: string | null;
    introTextEn: string | null;
    photoRequestTextHe: string | null;
    photoRequestTextRu: string | null;
    photoRequestTextEn: string | null;
    blessingPromptTextHe: string | null;
    blessingPromptTextRu: string | null;
    blessingPromptTextEn: string | null;
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

export default function EditProjectForm({ project, eventTypeOptions, questionTemplates, introTemplates, onSaved, readOnly }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [questionMode, setQuestionMode] = useState<"ALL" | "PICK_ONE">(project.questionMode);
  const [eventType, setEventType] = useState(project.eventType ?? "");
  const [showRu, setShowRu] = useState(
    Boolean(
      project.introTextRu ||
        project.photoRequestTextRu ||
        project.blessingPromptTextRu ||
        project.questions.some((q) => q.textRu || q.helperTextRu)
    )
  );
  const [showEn, setShowEn] = useState(
    Boolean(
      project.introTextEn ||
        project.photoRequestTextEn ||
        project.blessingPromptTextEn ||
        project.questions.some((q) => q.textEn || q.helperTextEn)
    )
  );

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
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 28 }}>
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

      <hr style={dividerStyle} />

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
