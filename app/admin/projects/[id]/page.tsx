import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "../../../../lib/prisma";
import ProjectSettingsPanel from "./ProjectSettingsPanel";
import InviteesTable from "./InviteesTable";
import DashboardCards from "./DashboardCards";
import ProjectActionsMenu from "./ProjectActionsMenu";

export const dynamic = "force-dynamic";

const LANGUAGE_LABEL: Record<string, string> = { HE: "עברית", RU: "רוסית", EN: "אנגלית" };
const DEFAULT_EVENT_TYPES = ["יום הולדת", "חתונת זהב", "בר / בת מצווה", "ברית / בריתה", "ספר זיכרון"];

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [project, usedEventTypes, questionTemplates, introTemplates] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      include: {
        questions: { orderBy: { sortOrder: "asc" } },
        invitees: {
          orderBy: { createdAt: "asc" },
          include: { inviteLink: true, submission: { include: { mediaAssets: true, answers: true } } },
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

  if (!project) notFound();

  const eventTypeOptions = Array.from(
    new Set([...DEFAULT_EVENT_TYPES, ...usedEventTypes.map((p) => p.eventType).filter((v): v is string => Boolean(v))])
  );

  const totalPhotos = project.invitees.reduce(
    (sum, invitee) => sum + (invitee.submission?.mediaAssets.length ?? 0),
    0
  );
  const submittedCount = project.invitees.filter((i) => i.submission).length;
  const startedCount = project.invitees.filter((i) => i.inviteLink?.firstViewedAt).length;

  const headersList = await headers();
  const host = headersList.get("host");
  const proto = headersList.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "production" ? "https" : "http");
  const baseUrl = `${proto}://${host}`;

  return (
    <main>
      <p style={{ marginBottom: 4 }}>
        <a href="/admin/projects">← כל הפרויקטים</a>
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>{project.name}</h1>
        <ProjectActionsMenu projectId={project.id} status={project.status} totalPhotos={totalPhotos} />
      </div>
      <p style={{ color: "#666", marginBottom: 24 }}>
        {project.status === "ACTIVE" ? "פעיל" : "סגור"}
        {project.eventDate ? ` · תאריך אירוע: ${project.eventDate.toLocaleDateString("he-IL")}` : ""}
        {` · שפת ברירת מחדל: ${LANGUAGE_LABEL[project.defaultLanguage]}`}
      </p>

      <DashboardCards
        eventDate={project.eventDate}
        totalParticipants={project.invitees.length}
        startedCount={startedCount}
        totalPhotos={totalPhotos}
        submittedCount={submittedCount}
      >
        <ProjectSettingsPanel
          project={project}
          eventTypeOptions={eventTypeOptions}
          questionTemplates={questionTemplates.map((t) => ({ id: t.id, textHe: t.textHe, helperTextHe: t.helperTextHe }))}
          introTemplates={introTemplates.map((t) => ({ id: t.id, label: t.label, textHe: t.textHe }))}
        />
      </DashboardCards>

      <InviteesTable
        projectId={project.id}
        baseUrl={baseUrl}
        invitees={project.invitees}
        questions={project.questions.map((q) => ({ id: q.id, text: q.textHe }))}
        defaultLanguage={project.defaultLanguage}
      />
    </main>
  );
}
