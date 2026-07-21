"use client";

import { useState } from "react";
import { updateProjectDetails } from "../../../lib/actions";
import CoverImageUpload from "./CoverImageUpload";
import EventTypeSelect from "./EventTypeSelect";
import IntroTextBuilder from "./IntroTextBuilder";
import QuestionsBuilder from "./QuestionsBuilder";

type Props = {
  project: {
    id: string;
    name: string;
    customerName: string | null;
    customerPhone: string | null;
    eventType: string | null;
    eventDate: Date | null;
    submissionDeadline: Date | null;
    notes: string | null;
    coverImageUrl: string | null;
    introTextHe: string | null;
    introTextRu: string | null;
    introTextEn: string | null;
    questions: { id: string; textHe: string; textRu: string | null; textEn: string | null; helperTextHe: string | null }[];
  };
  eventTypeOptions: string[];
  questionTemplates: { id: string; textHe: string; helperTextHe: string | null }[];
  introTemplates: { id: string; label: string; textHe: string }[];
  onSaved: () => void;
};

function toDateInputValue(date: Date | null): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export default function EditProjectForm({ project, eventTypeOptions, questionTemplates, introTemplates, onSaved }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 20 }}>
      <h2 style={{ fontSize: 18, margin: 0 }}>עריכת פרויקט</h2>

      <div style={{ display: "grid", gap: 10 }}>
        <label>
          <span style={labelStyle}>שם הפרויקט</span>
          <input name="name" defaultValue={project.name} required style={inputStyle} />
        </label>

        <div>
          <span style={labelStyle}>סוג האירוע</span>
          <EventTypeSelect options={eventTypeOptions} initialValue={project.eventType ?? ""} />
        </div>

        <div style={rowStyle}>
          <label>
            <span style={labelStyle}>תאריך האירוע</span>
            <input name="eventDate" type="date" defaultValue={toDateInputValue(project.eventDate)} style={inputStyle} />
          </label>
          <label>
            <span style={labelStyle}>תאריך סיום איסוף חומרים</span>
            <input name="submissionDeadline" type="date" defaultValue={toDateInputValue(project.submissionDeadline)} style={inputStyle} />
          </label>
        </div>

        <div style={rowStyle}>
          <label>
            <span style={labelStyle}>שם הלקוח</span>
            <input name="customerName" defaultValue={project.customerName ?? ""} style={inputStyle} />
          </label>
          <label>
            <span style={labelStyle}>טלפון הלקוח</span>
            <input name="customerPhone" defaultValue={project.customerPhone ?? ""} style={inputStyle} />
          </label>
        </div>

        <label>
          <span style={labelStyle}>הערות פנימיות</span>
          <textarea
            name="notes"
            defaultValue={project.notes ?? ""}
            placeholder="לא מוצג למוזמנים"
            rows={3}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </label>
        <CoverImageUpload initialUrl={project.coverImageUrl} />
      </div>

      <IntroTextBuilder
        templates={introTemplates}
        initialText={project.introTextHe ?? ""}
        initialTextRu={project.introTextRu ?? ""}
        initialTextEn={project.introTextEn ?? ""}
      />
      <QuestionsBuilder templates={questionTemplates} existingQuestions={project.questions} />

      {error && <p style={{ color: "#b00020", fontSize: 14 }}>{error}</p>}

      <button type="submit" disabled={submitting} style={buttonStyle}>
        {submitting ? "שומר..." : "שמירה"}
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
