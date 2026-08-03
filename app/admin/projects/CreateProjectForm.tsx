"use client";

import { useState } from "react";
import { createProject } from "../../../lib/actions";
import CoverImageUpload from "./CoverImageUpload";
import EventTypeSelect from "./EventTypeSelect";
import IntroTextBuilder from "./IntroTextBuilder";
import QuestionsBuilder from "./QuestionsBuilder";
import QuestionModeSelect from "./QuestionModeSelect";
import LanguageCheckboxes from "./LanguageCheckboxes";
import { celebrantLabelFor } from "./eventTypeEmoji";
import { labelStyle, sectionHeaderStyle, inputStyle, ltrInputStyle, rowStyle, buttonStyle, dividerStyle } from "./formStyles";

type Props = {
  eventTypeOptions: string[];
  questionTemplates: { id: string; textHe: string; helperTextHe: string | null }[];
  introTemplates: { id: string; label: string; textHe: string }[];
};

// The materials-collection deadline defaults to 3 weeks before the event, computed
// in UTC to avoid local-timezone date-shift issues with plain YYYY-MM-DD strings.
function computeDeadline(eventDateStr: string): string {
  const [y, m, d] = eventDateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() - 21);
  return date.toISOString().slice(0, 10);
}

const BLESSING_PROMPT_DEFAULT = "כמה מילים לברכה...";

export default function CreateProjectForm({ eventTypeOptions, questionTemplates, introTemplates }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [questionMode, setQuestionMode] = useState<"ALL" | "PICK_ONE">("PICK_ONE");
  const [eventType, setEventType] = useState("");
  const [showRu, setShowRu] = useState(false);
  const [showEn, setShowEn] = useState(false);

  const [eventDate, setEventDate] = useState("");
  const [submissionDeadline, setSubmissionDeadline] = useState("");
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
      await createProject(new FormData(e.currentTarget));
    } catch (err) {
      // A successful createProject ends in redirect(), which throws a digest-tagged
      // control-flow error the framework uses to navigate — not a real failure.
      const digest = (err as { digest?: string })?.digest;
      if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) {
        return;
      }
      setError(err instanceof Error ? err.message : "משהו השתבש, נסי שוב");
      setSubmitting(false);
    }
  }

  const pickOneColumnCount = 1 + (showRu ? 1 : 0) + (showEn ? 1 : 0);

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 28 }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: "#1a1d23" }}>פרויקט חדש</h2>

      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <h3 style={sectionHeaderStyle}>פרטי הראשיים</h3>
          <div style={{ width: 240 }}>
            <span style={labelStyle}>סוג האירוע</span>
            <EventTypeSelect options={eventTypeOptions} onValueChange={setEventType} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 16, alignItems: "start" }}>
          <CoverImageUpload />
          <div style={{ display: "grid", gap: 16 }}>
            <div style={rowStyle}>
              <label>
                <span style={labelStyle}>שם הפרויקט</span>
                <input name="name" placeholder="לדוגמה: 50 שנה לחתונת ההורים" required style={inputStyle} />
              </label>
              <label>
                <span style={labelStyle}>{celebrantLabelFor(eventType)}</span>
                <input name="celebrantNames" placeholder="אופציונלי" style={inputStyle} />
              </label>
            </div>

            <div style={rowStyle}>
              <label>
                <span style={labelStyle}>שם הלקוח</span>
                <input name="customerName" placeholder="אופציונלי" style={inputStyle} />
              </label>
              <label>
                <span style={labelStyle}>טלפון הלקוח</span>
                <input name="customerPhone" placeholder="אופציונלי" style={inputStyle} />
              </label>
            </div>

            <div style={rowStyle}>
              <label>
                <span style={labelStyle}>תאריך האירוע</span>
                <input
                  name="eventDate"
                  type="date"
                  value={eventDate}
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
                  onChange={(e) => handleDeadlineChange(e.target.value)}
                  style={inputStyle}
                />
              </label>
            </div>
          </div>
        </div>

        <label>
          <span style={labelStyle}>הערות פנימיות</span>
          <textarea name="notes" placeholder="לא מוצג למוזמנים" rows={3} style={{ ...inputStyle, resize: "vertical", minHeight: 80 }} />
        </label>
      </div>

      <hr style={dividerStyle} />

      <div style={{ display: "flex", gap: 28, alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <QuestionModeSelect value={questionMode} onChange={setQuestionMode} />
        </div>
        <div style={{ flex: 1 }}>
          <LanguageCheckboxes showRu={showRu} showEn={showEn} onChangeRu={setShowRu} onChangeEn={setShowEn} />
        </div>
      </div>

      <hr style={dividerStyle} />

      <IntroTextBuilder templates={introTemplates} showRu={showRu} showEn={showEn} />

      <hr style={dividerStyle} />

      <QuestionsBuilder templates={questionTemplates} showRu={showRu} showEn={showEn} />

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
                <textarea name="blessingPromptTextHe" placeholder={BLESSING_PROMPT_DEFAULT} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
              </label>
              <label style={{ display: showRu ? "block" : "none" }}>
                <span style={labelStyle}>רוסית</span>
                <textarea name="blessingPromptTextRu" rows={2} style={{ ...ltrInputStyle, resize: "vertical" }} />
              </label>
              <label style={{ display: showEn ? "block" : "none" }}>
                <span style={labelStyle}>אנגלית</span>
                <textarea name="blessingPromptTextEn" rows={2} style={{ ...ltrInputStyle, resize: "vertical" }} />
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
                <textarea name="photoRequestTextHe" rows={3} style={{ ...inputStyle, resize: "vertical" }} />
              </label>
              <label style={{ display: showRu ? "block" : "none" }}>
                <span style={labelStyle}>רוסית</span>
                <textarea name="photoRequestTextRu" rows={3} style={{ ...ltrInputStyle, resize: "vertical" }} />
              </label>
              <label style={{ display: showEn ? "block" : "none" }}>
                <span style={labelStyle}>אנגלית</span>
                <textarea name="photoRequestTextEn" rows={3} style={{ ...ltrInputStyle, resize: "vertical" }} />
              </label>
            </div>
          </div>
        </>
      )}

      <hr style={dividerStyle} />

      {error && <p style={{ color: "#b00020", fontSize: 14 }}>{error}</p>}

      <button type="submit" disabled={submitting} style={{ ...buttonStyle, opacity: submitting ? 0.7 : 1 }}>
        {submitting ? "יוצר..." : "יצירת פרויקט"}
      </button>
    </form>
  );
}
