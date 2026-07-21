"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Drawer from "../Drawer";
import EditProjectForm from "../EditProjectForm";
import { emojiFor } from "../eventTypeEmoji";
import { IconCircle, ImageIcon, cardStyle, cardHeadStyle, cardLabelStyle } from "./DashboardCards";

type ProjectData = {
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

type Props = {
  project: ProjectData;
  eventTypeOptions: string[];
  questionTemplates: { id: string; textHe: string; helperTextHe: string | null }[];
  introTemplates: { id: string; label: string; textHe: string }[];
};

function formatDate(date: Date | null): string {
  return date ? date.toLocaleDateString("he-IL") : "—";
}

export default function ProjectSettingsPanel({ project, eventTypeOptions, questionTemplates, introTemplates }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [coverFailed, setCoverFailed] = useState(false);

  function close() {
    setOpen(false);
    setMode("view");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setMode("view");
          setOpen(true);
        }}
        style={{ ...cardStyle, textAlign: "start", cursor: "pointer" }}
      >
        <div style={cardHeadStyle}>
          <IconCircle color="#6c5ce7" bg="#f0eefc">
            <ImageIcon />
          </IconCircle>
          <span style={cardLabelStyle}>הגדרות הפרויקט</span>
        </div>
        {project.coverImageUrl && !coverFailed ? (
          <img
            src={project.coverImageUrl}
            alt={project.name}
            onError={() => setCoverFailed(true)}
            style={{ width: "100%", height: 76, objectFit: "cover", borderRadius: 10, marginTop: 10 }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: 76,
              borderRadius: 10,
              marginTop: 10,
              background: "#f7f6f4",
              border: "1px dashed #e0ddd7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              color: "#b5b3ae",
            }}
          >
            אין תמונת בית
          </div>
        )}
      </button>

      {open && (
        <Drawer onClose={close}>
          {mode === "edit" ? (
            <EditProjectForm
              project={project}
              eventTypeOptions={eventTypeOptions}
              questionTemplates={questionTemplates}
              introTemplates={introTemplates}
              onSaved={() => {
                setMode("view");
                router.refresh();
              }}
            />
          ) : (
            <div style={{ display: "grid", gap: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h2 style={{ fontSize: 18, margin: 0 }}>פרטי הפרויקט</h2>
                <button type="button" onClick={() => setMode("edit")} style={{ ...buttonStyle, padding: "6px 12px", fontSize: 13 }}>
                  עריכה
                </button>
              </div>

              {project.coverImageUrl && (
                <img
                  src={project.coverImageUrl}
                  alt=""
                  style={{ width: "100%", aspectRatio: "1 / 1", objectFit: "cover", borderRadius: 8 }}
                />
              )}

              <Field label="סוג האירוע" value={project.eventType ? `${emojiFor(project.eventType)} ${project.eventType}` : "—"} />
              <Field label="שם הלקוח" value={project.customerName ?? "—"} />
              <Field label="טלפון הלקוח" value={project.customerPhone ?? "—"} />
              <Field label="תאריך האירוע" value={formatDate(project.eventDate)} />
              <Field label="תאריך סיום איסוף חומרים" value={formatDate(project.submissionDeadline)} />
              {project.notes && <Field label="הערות פנימיות" value={project.notes} />}

              {(project.introTextHe || project.introTextRu || project.introTextEn) && (
                <div>
                  <p style={labelStyle}>טקסט פתיחה למוזמנים</p>
                  {project.introTextHe && <p style={valueStyle}>{project.introTextHe}</p>}
                  {project.introTextRu && <p style={{ ...valueStyle, color: "#888" }}>RU: {project.introTextRu}</p>}
                  {project.introTextEn && <p style={{ ...valueStyle, color: "#888" }}>EN: {project.introTextEn}</p>}
                </div>
              )}

              <div>
                <p style={labelStyle}>שאלות ({project.questions.length})</p>
                {project.questions.length === 0 && <p style={valueStyle}>אין שאלות</p>}
                <ul style={{ paddingInlineStart: 20, margin: 0 }}>
                  {project.questions.map((q) => (
                    <li key={q.id} style={{ marginBottom: 6, fontSize: 14 }}>
                      {q.textHe}
                      {q.textRu && <span style={{ color: "#888" }}> · RU: {q.textRu}</span>}
                      {q.textEn && <span style={{ color: "#888" }}> · EN: {q.textEn}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </Drawer>
      )}
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={labelStyle}>{label}</p>
      <p style={valueStyle}>{value}</p>
    </div>
  );
}

const labelStyle: React.CSSProperties = { fontSize: 12, color: "#888", margin: "0 0 2px" };
const valueStyle: React.CSSProperties = { fontSize: 15, margin: 0 };

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
