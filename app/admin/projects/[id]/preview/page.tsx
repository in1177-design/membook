import { notFound } from "next/navigation";
import { prisma } from "../../../../../lib/prisma";
import SubmissionWizard from "../../../../i/[token]/SubmissionWizard";
import { CONTENT, PICK_ONE_FALLBACK_TEXT, introGuidanceFor, eventTypeLabelFor } from "../../../../i/[token]/content";
import PreviewDeviceFrame from "./PreviewDeviceFrame";

export const dynamic = "force-dynamic";

export default async function ProjectFormPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: { questions: { orderBy: { sortOrder: "asc" } } },
  });

  if (!project) notFound();

  const questions = project.questions.map((q) => ({
    id: q.id,
    textHe: q.textHe,
    textRu: q.textRu ?? undefined,
    textEn: q.textEn ?? undefined,
    helperTextHe: q.helperTextHe ?? undefined,
    helperTextRu: q.helperTextRu ?? undefined,
    helperTextEn: q.helperTextEn ?? undefined,
    existingAnswer: "",
  }));

  const headlineTexts = {
    HE: project.guestHeadlineHe ?? project.name,
    RU: project.guestHeadlineRu ?? project.guestHeadlineHe ?? project.name,
    EN: project.guestHeadlineEn ?? project.guestHeadlineHe ?? project.name,
  };

  const introTexts = {
    HE: project.introTextHe ?? CONTENT.HE.intro,
    RU: project.introTextRu ?? project.introTextHe ?? CONTENT.RU.intro,
    EN: project.introTextEn ?? project.introTextHe ?? CONTENT.EN.intro,
  };

  const photoRequestTexts = {
    HE: project.photoRequestTextHe ?? PICK_ONE_FALLBACK_TEXT.HE.photoRequest,
    RU: project.photoRequestTextRu ?? project.photoRequestTextHe ?? PICK_ONE_FALLBACK_TEXT.RU.photoRequest,
    EN: project.photoRequestTextEn ?? project.photoRequestTextHe ?? PICK_ONE_FALLBACK_TEXT.EN.photoRequest,
  };

  const blessingPromptTexts = {
    HE: project.blessingPromptTextHe ?? PICK_ONE_FALLBACK_TEXT.HE.blessingPrompt,
    RU: project.blessingPromptTextRu ?? project.blessingPromptTextHe ?? PICK_ONE_FALLBACK_TEXT.RU.blessingPrompt,
    EN: project.blessingPromptTextEn ?? project.blessingPromptTextHe ?? PICK_ONE_FALLBACK_TEXT.EN.blessingPrompt,
  };

  const eventTypeLabels = {
    HE: eventTypeLabelFor(project.eventType, "HE"),
    RU: eventTypeLabelFor(project.eventType, "RU"),
    EN: eventTypeLabelFor(project.eventType, "EN"),
  };

  return (
    <main>
      <h1 style={{ fontSize: 24, margin: "0 0 12px" }}>תצוגה מקדימה של הטופס</h1>
      <PreviewDeviceFrame initialLanguage={project.defaultLanguage}>
        <SubmissionWizard
          token="preview"
          headlineTexts={headlineTexts}
          content={CONTENT}
          introTexts={introTexts}
          introGuidance={introGuidanceFor(project.questionMode)}
          eventTypeLabels={eventTypeLabels}
          photoRequestTexts={photoRequestTexts}
          blessingPromptTexts={blessingPromptTexts}
          coverImageUrl={project.coverImageUrl}
          coverImagePositionY={project.coverImagePositionY}
          projectId={project.id}
          initialLanguage={project.defaultLanguage}
          questions={questions}
          questionMode={project.questionMode}
          isCompleted={false}
          existingPhotoUrl={null}
          existingDateLocation={null}
          existingBlessingText={null}
          existingBlessingSignedBy={null}
          previewMode
        />
      </PreviewDeviceFrame>
    </main>
  );
}
