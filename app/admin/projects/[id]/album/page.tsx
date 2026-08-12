import { notFound } from "next/navigation";
import { prisma } from "../../../../../lib/prisma";
import AlbumDesignBoard from "./AlbumDesignBoard";

export const dynamic = "force-dynamic";

export default async function AlbumDesignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      defaultLanguage: true,
      questions: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, textHe: true, textRu: true, textEn: true, helperTextHe: true, helperTextRu: true, helperTextEn: true },
      },
      invitees: {
        where: { submission: { isNot: null } },
        select: {
          id: true,
          name: true,
          language: true,
          submission: {
            select: {
              id: true,
              sortOrder: true,
              submittedAt: true,
              dateLocation: true,
              blessingText: true,
              blessingSignedBy: true,
              additionalText: true,
              answers: { select: { questionId: true, text: true } },
              mediaAssets: { orderBy: { createdAt: "asc" }, take: 1, select: { id: true, url: true, width: true, height: true } },
            },
          },
        },
      },
    },
  });

  if (!project) notFound();

  const spreads = project.invitees
    .filter((i) => i.submission)
    .map((i) => ({
      submissionId: i.submission!.id,
      inviteeId: i.id,
      inviteeName: i.name,
      language: i.language,
      photoId: i.submission!.mediaAssets[0]?.id ?? null,
      photoUrl: i.submission!.mediaAssets[0]?.url ?? null,
      photoWidth: i.submission!.mediaAssets[0]?.width ?? null,
      photoHeight: i.submission!.mediaAssets[0]?.height ?? null,
      dateLocation: i.submission!.dateLocation,
      blessingText: i.submission!.blessingText,
      blessingSignedBy: i.submission!.blessingSignedBy,
      additionalText: i.submission!.additionalText,
      answers: Object.fromEntries(i.submission!.answers.map((a) => [a.questionId, a.text])),
      sortOrder: i.submission!.sortOrder,
      submittedAt: i.submission!.submittedAt.getTime(),
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.submittedAt - b.submittedAt)
    .map(({ sortOrder, submittedAt, ...spread }) => spread);

  return (
    <main>
      <h1 style={{ fontSize: 24, margin: "0 0 4px" }}>עיצוב האלבום</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>
        כאן רואים את כל הכפולות שנוצרו לאלבום. גררי כדי לשנות את הסדר.
      </p>

      <AlbumDesignBoard projectId={project.id} defaultLanguage={project.defaultLanguage} questions={project.questions} initialSpreads={spreads} />
    </main>
  );
}
