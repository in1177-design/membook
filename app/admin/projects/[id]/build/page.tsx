import { notFound } from "next/navigation";
import { prisma } from "../../../../../lib/prisma";
import BuildPage from "./BuildPage";

export const dynamic = "force-dynamic";

export default async function ProjectBuildPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: { questions: { orderBy: { sortOrder: "asc" } } },
  });
  if (!project) notFound();

  return (
    <BuildPage
      project={{
        id: project.id,
        name: project.name,
        eventType: project.eventType,
        coverImageUrl: project.coverImageUrl,
        coverImagePositionY: project.coverImagePositionY,
        questionMode: project.questionMode,
        guestHeadlineHe: project.guestHeadlineHe,
        guestHeadlineRu: project.guestHeadlineRu,
        guestHeadlineEn: project.guestHeadlineEn,
        introTextHe: project.introTextHe,
        introTextRu: project.introTextRu,
        introTextEn: project.introTextEn,
        blessingPromptTextHe: project.blessingPromptTextHe,
        blessingPromptTextRu: project.blessingPromptTextRu,
        blessingPromptTextEn: project.blessingPromptTextEn,
        photoRequestTextHe: project.photoRequestTextHe,
        photoRequestTextRu: project.photoRequestTextRu,
        photoRequestTextEn: project.photoRequestTextEn,
        questions: project.questions.map((q) => ({
          id: q.id,
          textHe: q.textHe,
          textRu: q.textRu,
          textEn: q.textEn,
          helperTextHe: q.helperTextHe,
          helperTextRu: q.helperTextRu,
          helperTextEn: q.helperTextEn,
        })),
      }}
    />
  );
}
