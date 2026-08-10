"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
