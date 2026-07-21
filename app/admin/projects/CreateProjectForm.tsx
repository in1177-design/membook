"use client";

import { useState } from "react";
import { createProject } from "../../../lib/actions";
import CoverImageUpload from "./CoverImageUpload";
import EventTypeSelect from "./EventTypeSelect";
import IntroTextBuilder from "./IntroTextBuilder";
import QuestionsBuilder from "./QuestionsBuilder";

type Props = {
  eventTypeOptions: string[];
  questionTemplates: { id: string; textHe: string; helperTextHe: string | null }[];
  introTemplates: { id: string; label: string; textHe: string }[];
};

export default function CreateProjectForm({ eventTypeOptions, questionTemplates, introTemplates }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 20 }}>
      <h2 style={{ fontSize: 18, margin: 0 }}>פרויקט חדש</h2>

      <div style={{ display: "grid", gap: 10 }}>
        <label>
          <span style={labelStyle}>שם הפרויקט</span>
          <input name="name" placeholder="לדוגמה: 50 שנה לחתונת ההורים" required style={inputStyle} />
        </label>

        <div>
          <span style={labelStyle}>סוג האירוע</span>
          <EventTypeSelect options={eventTypeOptions} />
        </div>

        <div style={rowStyle}>
          <label>
            <span style={labelStyle}>תאריך האירוע</span>
            <input name="eventDate" type="date" style={inputStyle} />
          </label>
          <label>
            <span style={labelStyle}>תאריך סיום איסוף חומרים</span>
            <input name="submissionDeadline" type="date" style={inputStyle} />
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

        <label>
          <span style={labelStyle}>שפת ברירת מחדל</span>
          <select name="defaultLanguage" defaultValue="HE" style={inputStyle}>
            <option value="HE">עברית</option>
            <option value="RU">רוסית</option>
            <option value="EN">אנגלית</option>
          </select>
        </label>
        <label>
          <span style={labelStyle}>הערות פנימיות</span>
          <textarea name="notes" placeholder="לא מוצג למוזמנים" rows={3} style={{ ...inputStyle, resize: "vertical" }} />
        </label>
        <CoverImageUpload />
      </div>

      <IntroTextBuilder templates={introTemplates} />
      <QuestionsBuilder templates={questionTemplates} />

      {error && <p style={{ color: "#b00020", fontSize: 14 }}>{error}</p>}

      <button type="submit" disabled={submitting} style={buttonStyle}>
        {submitting ? "יוצר..." : "יצירת פרויקט"}
      </button>
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "8px 10px",
  fontSize: 15,
  border: "1px solid #ccc",
  borderRadius: 6,
  width: "100%",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "#333",
  marginBottom: 4,
};

const rowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
};

const buttonStyle: React.CSSProperties = {
  padding: "10px 14px",
  fontSize: 15,
  background: "#1f1f1f",
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  width: "fit-content",
};
