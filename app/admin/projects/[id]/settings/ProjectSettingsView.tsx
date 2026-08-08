"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import EditProjectForm from "../../EditProjectForm";
import { sectionHeaderStyle, secondaryButtonStyle } from "../../formStyles";

type ProjectData = {
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

type Props = {
  project: ProjectData;
  eventTypeOptions: string[];
  questionTemplates: { id: string; textHe: string; helperTextHe: string | null }[];
  introTemplates: { id: string; label: string; textHe: string }[];
};

export default function ProjectSettingsView({ project, eventTypeOptions, questionTemplates, introTemplates }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"view" | "edit">("view");

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <h2 style={sectionHeaderStyle}>פרטי הפרויקט</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href={`/admin/projects/${project.id}/build`} style={{ fontSize: 13, fontWeight: 600, color: "#4a6c9b" }}>
            נסי את דף הבנייה החדש (בטא) →
          </Link>
          {mode === "view" && (
            <button type="button" onClick={() => setMode("edit")} style={secondaryButtonStyle}>
              עריכה
            </button>
          )}
        </div>
      </div>

      <EditProjectForm
        project={project}
        eventTypeOptions={eventTypeOptions}
        questionTemplates={questionTemplates}
        introTemplates={introTemplates}
        onSaved={() => {
          setMode("view");
          router.refresh();
        }}
        readOnly={mode === "view"}
      />
    </div>
  );
}
