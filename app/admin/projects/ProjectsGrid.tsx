"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Drawer from "./Drawer";
import CreateProjectForm from "./CreateProjectForm";
import EditProjectForm from "./EditProjectForm";
import { emojiFor } from "./eventTypeEmoji";
import { deleteProject } from "../../../lib/actions";

type Project = {
  id: string;
  name: string;
  celebrantNames: string | null;
  status: "ACTIVE" | "CLOSED";
  coverImageUrl: string | null;
  eventDate: Date | null;
  customerName: string | null;
  customerPhone: string | null;
  eventType: string | null;
  submissionDeadline: Date | null;
  notes: string | null;
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
  _count: { invitees: number };
};

type Props = {
  projects: Project[];
  eventTypeOptions: string[];
  questionTemplates: { id: string; textHe: string; helperTextHe: string | null }[];
  introTemplates: { id: string; label: string; textHe: string }[];
};

export default function ProjectsGrid({ projects, eventTypeOptions, questionTemplates, introTemplates }: Props) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(p: Project) {
    if (!window.confirm(`למחוק לצמיתות את הפרויקט "${p.name}"? הפעולה בלתי הפיכה ותמחק גם את כל המוזמנים והתשובות שנאספו.`)) {
      return;
    }
    setDeletingId(p.id);
    try {
      await deleteProject(p.id);
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            border: "1px dashed #bbb",
            borderRadius: 12,
            background: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            color: "#888",
            minHeight: 168,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          <span style={{ fontSize: 22 }}>+</span>
          פרויקט חדש
        </button>

        {projects.map((p) => (
          <div
            key={p.id}
            onClick={() => router.push(`/admin/projects/${p.id}`)}
            style={{ position: "relative", border: "1px solid #ddd", borderRadius: 12, overflow: "hidden", cursor: "pointer" }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingProject(p);
              }}
              style={{
                position: "absolute",
                top: 8,
                left: 8,
                zIndex: 1,
                fontSize: 12,
                padding: "4px 10px",
                background: "white",
                border: "1px solid #ddd",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              עריכה
            </button>
            {p.status === "CLOSED" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(p);
                }}
                disabled={deletingId === p.id}
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  zIndex: 1,
                  fontSize: 12,
                  padding: "4px 10px",
                  background: "white",
                  border: "1px solid #e0b4b4",
                  color: "#b00020",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                {deletingId === p.id ? "מוחק..." : "מחיקה"}
              </button>
            )}
            <div
              style={{
                aspectRatio: "1 / 1",
                width: "100%",
                background: p.coverImageUrl ? undefined : "#f2f2f2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              {p.coverImageUrl ? (
                <img src={p.coverImageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ color: "#aaa", fontSize: 13 }}>אין תמונת בית</span>
              )}
              <span
                style={{
                  position: "absolute",
                  bottom: 8,
                  right: 8,
                  fontSize: 20,
                  background: "white",
                  borderRadius: "50%",
                  width: 34,
                  height: 34,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                }}
              >
                {emojiFor(p.eventType)}
              </span>
            </div>
            <div style={{ padding: "12px 14px" }}>
              <span
                style={{
                  display: "inline-block",
                  marginBottom: 8,
                  fontSize: 12,
                  padding: "3px 10px",
                  borderRadius: 6,
                  background: p.status === "ACTIVE" ? "#faeeda" : "#f2f2f2",
                  color: p.status === "ACTIVE" ? "#854f0b" : "#666",
                }}
              >
                {p.status === "ACTIVE" ? "פעיל" : "סגור"}
              </span>
              <p style={{ fontWeight: 600, fontSize: 15, margin: "0 0 4px" }}>{p.name}</p>
              <p style={{ fontSize: 13, color: "#888", margin: 0 }}>
                {p._count.invitees} מוזמנים
                {p.eventDate ? ` · ${p.eventDate.toLocaleDateString("he-IL")}` : ""}
              </p>
            </div>
          </div>
        ))}
      </div>
      {projects.length === 0 && <p style={{ color: "#888", marginTop: 12 }}>אין עדיין פרויקטים.</p>}

      {showCreate && (
        <Drawer onClose={() => setShowCreate(false)}>
          <CreateProjectForm eventTypeOptions={eventTypeOptions} questionTemplates={questionTemplates} introTemplates={introTemplates} />
        </Drawer>
      )}

      {editingProject && (
        <Drawer onClose={() => setEditingProject(null)}>
          <EditProjectForm
            project={editingProject}
            eventTypeOptions={eventTypeOptions}
            questionTemplates={questionTemplates}
            introTemplates={introTemplates}
            onSaved={() => setEditingProject(null)}
          />
        </Drawer>
      )}
    </div>
  );
}
