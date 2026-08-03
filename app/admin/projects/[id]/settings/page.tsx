import { notFound } from "next/navigation";
import { prisma } from "../../../../../lib/prisma";
import ProjectSettingsView from "./ProjectSettingsView";

export const dynamic = "force-dynamic";

const DEFAULT_EVENT_TYPES = ["יום הולדת", "חתונת זהב", "בר / בת מצווה", "ברית / בריתה", "ספר זיכרון"];

export default async function ProjectSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [project, usedEventTypes, questionTemplates, introTemplates] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      include: { questions: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.project.findMany({
      where: { eventType: { not: null } },
      select: { eventType: true },
      distinct: ["eventType"],
    }),
    prisma.questionTemplate.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.introTemplate.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  if (!project) notFound();

  const eventTypeOptions = Array.from(
    new Set([...DEFAULT_EVENT_TYPES, ...usedEventTypes.map((p) => p.eventType).filter((v): v is string => Boolean(v))])
  );

  return (
    <main>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1a1d23", margin: "0 0 4px" }}>הגדרות הפרויקט</h1>
        <p style={{ fontSize: 16, fontWeight: 600, color: "#4e5565", margin: 0 }}>עריכת פרויקט</p>
      </div>
      <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "0 0 28px" }} />

      <ProjectSettingsView
        project={project}
        eventTypeOptions={eventTypeOptions}
        questionTemplates={questionTemplates.map((t) => ({ id: t.id, textHe: t.textHe, helperTextHe: t.helperTextHe }))}
        introTemplates={introTemplates.map((t) => ({ id: t.id, label: t.label, textHe: t.textHe }))}
      />
    </main>
  );
}
