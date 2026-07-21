import { prisma } from "../../../lib/prisma";
import ProjectsGrid from "./ProjectsGrid";

export const dynamic = "force-dynamic";

const DEFAULT_EVENT_TYPES = ["יום הולדת", "חתונת זהב", "בר / בת מצווה", "ברית / בריתה", "ספר זיכרון"];

export default async function ProjectsPage() {
  const [projects, usedEventTypes, questionTemplates, introTemplates] = await Promise.all([
    prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { invitees: true } },
        questions: {
          orderBy: { sortOrder: "asc" },
          select: { id: true, textHe: true, textRu: true, textEn: true, helperTextHe: true },
        },
      },
    }),
    prisma.project.findMany({
      where: { eventType: { not: null } },
      select: { eventType: true },
      distinct: ["eventType"],
    }),
    prisma.questionTemplate.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.introTemplate.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  const eventTypeOptions = Array.from(
    new Set([...DEFAULT_EVENT_TYPES, ...usedEventTypes.map((p) => p.eventType).filter((v): v is string => Boolean(v))])
  );

  return (
    <main style={{ maxWidth: 900, margin: "40px auto", padding: 24 }}>
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>ספר זיכרון</h1>
      <p style={{ color: "#666", marginBottom: 24, fontSize: 14 }}>כל פרויקטי איסוף החומרים שלך במקום אחד</p>

      <ProjectsGrid
        projects={projects}
        eventTypeOptions={eventTypeOptions}
        questionTemplates={questionTemplates.map((t) => ({ id: t.id, textHe: t.textHe, helperTextHe: t.helperTextHe }))}
        introTemplates={introTemplates.map((t) => ({ id: t.id, label: t.label, textHe: t.textHe }))}
      />
    </main>
  );
}
