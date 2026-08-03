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
      invitees: {
        where: { submission: { isNot: null } },
        select: {
          id: true,
          name: true,
          submission: {
            select: {
              id: true,
              sortOrder: true,
              submittedAt: true,
              mediaAssets: { orderBy: { createdAt: "asc" }, take: 1, select: { url: true } },
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
      inviteeName: i.name,
      photoUrl: i.submission!.mediaAssets[0]?.url ?? null,
      sortOrder: i.submission!.sortOrder,
      submittedAt: i.submission!.submittedAt.getTime(),
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.submittedAt - b.submittedAt)
    .map(({ submissionId, inviteeName, photoUrl }) => ({ submissionId, inviteeName, photoUrl }));

  return (
    <main>
      <h1 style={{ fontSize: 24, margin: "0 0 4px" }}>עיצוב האלבום</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>
        כאן רואים את כל הכפולות שנוצרו לאלבום. גררי כדי לשנות את הסדר.
      </p>

      <AlbumDesignBoard projectId={project.id} initialSpreads={spreads} />
    </main>
  );
}
