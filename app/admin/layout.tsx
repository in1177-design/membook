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
        select: { submission: { select: { completedAt: true } } },
      },
    },
  });

  if (projects.length === 0) {
    return <>{children}</>;
  }

  const allProjects = projects.map((p) => ({
    id: p.id,
    name: p.name,
    totalParticipants: p.invitees.length,
    // completedAt (not mere submission existence) — a Submission row can
    // exist from an admin pre-loading a photo before the invite is even
    // sent (see InviteesTable.tsx's statusOf), which shouldn't count toward
    // "submitted" here either.
    submittedCount: p.invitees.filter((i) => i.submission?.completedAt).length,
  }));

  return (
    <div style={{ display: "flex", gap: 24, alignItems: "stretch", width: "100%", minHeight: "100vh", padding: "24px 16px 24px 0", boxSizing: "border-box" }}>
      <ProjectSidebar allProjects={allProjects} />
      <div style={{ flex: 1, minWidth: 0, maxWidth: 1400, margin: "0 auto", paddingInlineEnd: 24, display: "flex", flexDirection: "column" }}>{children}</div>
    </div>
  );
}
