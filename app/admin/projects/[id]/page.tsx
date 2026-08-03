import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "../../../../lib/prisma";
import ProjectSettingsCard from "./ProjectSettingsCard";
import InviteesTable from "./InviteesTable";
import DashboardCards from "./DashboardCards";
import ProjectActionsMenu from "./ProjectActionsMenu";

export const dynamic = "force-dynamic";

const LANGUAGE_LABEL: Record<string, string> = { HE: "עברית", RU: "רוסית", EN: "אנגלית" };

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      questions: { orderBy: { sortOrder: "asc" } },
      invitees: {
        orderBy: { createdAt: "asc" },
        include: { inviteLink: true, submission: { include: { mediaAssets: true, answers: true } } },
      },
    },
  });

  if (!project) notFound();

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
        <ProjectSettingsCard projectId={project.id} projectName={project.name} coverImageUrl={project.coverImageUrl} />
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
