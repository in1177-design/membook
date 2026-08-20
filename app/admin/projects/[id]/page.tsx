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
  // completedAt (not mere submission existence) — see InviteesTable.tsx's
  // statusOf for why: a Submission row can exist purely from an admin
  // pre-loading a photo before the invite is ever sent.
  const submittedCount = project.invitees.filter((i) => i.submission?.completedAt).length;
  const startedCount = project.invitees.filter((i) => i.inviteLink?.firstViewedAt).length;
  // How many actual people ("אנשים") are coming, not just how many invitee
  // rows said yes — each confirmed ("YES") invitee counts as adultsCount (or
  // 1, themselves, if never specified) plus childrenCount (or 0 if unset).
  const confirmedInvitees = project.invitees.filter((i) => i.attending === "YES");
  const confirmedAdultsCount = confirmedInvitees.reduce((sum, i) => sum + (i.adultsCount ?? 1), 0);
  const confirmedChildrenCount = confirmedInvitees.reduce((sum, i) => sum + (i.childrenCount ?? 0), 0);
  const confirmedPeopleCount = confirmedAdultsCount + confirmedChildrenCount;

  const headersList = await headers();
  const host = headersList.get("host");
  const proto = headersList.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "production" ? "https" : "http");
  const baseUrl = `${proto}://${host}`;

  return (
    <main style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
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
        confirmedPeopleCount={confirmedPeopleCount}
        confirmedAdultsCount={confirmedAdultsCount}
        confirmedChildrenCount={confirmedChildrenCount}
      >
        <ProjectSettingsCard projectId={project.id} projectName={project.name} coverImageUrl={project.coverImageUrl} />
      </DashboardCards>

      {/* Flex-grows to fill remaining vertical space down to the viewport
          bottom (minHeight:0 lets it shrink below content size so its own
          internal scroll area — not the whole page — handles overflow). */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <InviteesTable
        projectId={project.id}
        baseUrl={baseUrl}
        invitees={project.invitees}
        questions={project.questions.map((q) => ({
          id: q.id,
          textHe: q.textHe,
          textRu: q.textRu,
          textEn: q.textEn,
          helperTextHe: q.helperTextHe,
          helperTextRu: q.helperTextRu,
          helperTextEn: q.helperTextEn,
        }))}
        defaultLanguage={project.defaultLanguage}
        enabledLanguages={project.languages}
        celebrantNames={project.celebrantNames ?? project.name}
        messageTemplates={{
          whatsappHe: project.whatsappTemplateHe,
          whatsappRu: project.whatsappTemplateRu,
          whatsappEn: project.whatsappTemplateEn,
          emailSubjectHe: project.emailSubjectTemplateHe,
          emailSubjectRu: project.emailSubjectTemplateRu,
          emailSubjectEn: project.emailSubjectTemplateEn,
          emailBodyHe: project.emailBodyTemplateHe,
          emailBodyRu: project.emailBodyTemplateRu,
          emailBodyEn: project.emailBodyTemplateEn,
        }}
      />
      </div>
    </main>
  );
}
