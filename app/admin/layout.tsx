import { headers } from "next/headers";
import { prisma } from "../../lib/prisma";
import ProjectSidebar from "./projects/[id]/ProjectSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      invitees: {
        select: { submission: { select: { mediaAssets: { select: { id: true } } } } },
      },
    },
  });

  if (projects.length === 0) {
    return <>{children}</>;
  }

  const allProjects = projects.map((p) => ({
    id: p.id,
    name: p.name,
    totalMaterials: p.invitees.reduce((sum, i) => sum + (i.submission?.mediaAssets.length ?? 0), 0),
    totalParticipants: p.invitees.length,
    submittedCount: p.invitees.filter((i) => i.submission).length,
  }));

  return (
    <div style={{ display: "flex", gap: 24, alignItems: "flex-start", maxWidth: 1400, margin: "24px auto", padding: "0 24px" }}>
      <ProjectSidebar allProjects={allProjects} />
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}
