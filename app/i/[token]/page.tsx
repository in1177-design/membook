import { headers } from "next/headers";
import { prisma } from "../../../lib/prisma";
import { detectDeviceType, detectIsBot } from "../../../lib/tracking";
import { isPastGracePeriod } from "../../../lib/linkValidity";
import SubmissionWizard from "./SubmissionWizard";
import { CONTENT, PICK_ONE_FALLBACK_TEXT, introGuidanceFor, eventTypeLabelFor } from "./content";

export const dynamic = "force-dynamic";

export default async function InviteePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const inviteLink = await prisma.inviteLink.findUnique({
    where: { token },
    include: {
      invitee: {
        include: {
          project: { include: { questions: { orderBy: { sortOrder: "asc" } } } },
          submission: {
            include: {
              answers: true,
              mediaAssets: true,
            },
          },
        },
      },
    },
  });

  const isExpired = inviteLink ? isPastGracePeriod(inviteLink.invitee.project.eventDate) : false;

  if (!inviteLink || inviteLink.revokedAt || isExpired) {
    return (
      <main style={{ maxWidth: 480, margin: "80px auto", padding: 24, textAlign: "center" }}>
        <h1 style={{ fontSize: 20 }}>הקישור הזה אינו תקף</h1>
        <p style={{ color: "#666" }}>אם זה נראה לך כמו טעות, כדאי לפנות למי ששלח לך את הקישור.</p>
      </main>
    );
  }

  const headersList = await headers();
  const userAgent = headersList.get("user-agent");
  const isBot = detectIsBot(userAgent);
  const deviceType = detectDeviceType(userAgent);

  await prisma.viewLog.create({
    data: { inviteLinkId: inviteLink.id, userAgent, isBot, deviceType },
  });

  if (!isBot) {
    await prisma.inviteLink.update({
      where: { id: inviteLink.id },
      data: {
        firstViewedAt: inviteLink.firstViewedAt ?? new Date(),
        lastViewedAt: new Date(),
      },
    });
  }

  const { invitee } = inviteLink;
  const { project } = invitee;
  const language = invitee.language ?? project.defaultLanguage;

  if (project.status === "CLOSED") {
    return (
      <main style={{ maxWidth: 480, margin: "80px auto", padding: 24, textAlign: "center" }}>
        <h1 style={{ fontSize: 20 }}>{project.name}</h1>
        <p style={{ color: "#666" }}>האיסוף לפרויקט הזה נסגר, תודה על התרומה שלך!</p>
      </main>
    );
  }

  const existingAnswers = new Map(
    invitee.submission?.answers.map((a) => [a.questionId, a.text]) ?? []
  );

  const questions = project.questions.map((q) => ({
    id: q.id,
    textHe: q.textHe,
    textRu: q.textRu ?? undefined,
    textEn: q.textEn ?? undefined,
    helperTextHe: q.helperTextHe ?? undefined,
    helperTextRu: q.helperTextRu ?? undefined,
    helperTextEn: q.helperTextEn ?? undefined,
    existingAnswer: existingAnswers.get(q.id) ?? "",
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
    <>
      <style>{`
        .invitee-bg { background: #f3ece0; min-height: 100vh; }
        .sub-page-main { padding: 40px 24px; box-sizing: border-box; }
        /* Mobile: the whole page turns white (matches the book's own
           full-bleed white look there) — only desktop keeps the cream
           page background showing around the book. */
        @media (max-width: 859px) {
          .invitee-bg { background: #fff; }
          /* Steps with a full-bleed hero (.sub-mobile-hero — intro/preview/
             done) lose the top/bottom page padding entirely so the hero
             photo touches the very top edge of the screen instead of
             floating 40px below it; steps without one keep the normal gap. */
          .sub-page-main:has(.sub-mobile-hero) { padding: 0 24px; }
        }
      `}</style>
      <div className="invitee-bg">
        <main className="sub-page-main" style={{ maxWidth: 1048, margin: "0 auto" }}>
          <SubmissionWizard
            token={token}
            headlineTexts={headlineTexts}
            content={CONTENT}
            introTexts={introTexts}
            introGuidance={introGuidanceFor(project.questionMode)}
            eventTypeLabels={eventTypeLabels}
            photoRequestTexts={photoRequestTexts}
            blessingPromptTexts={blessingPromptTexts}
            coverImageUrl={project.coverImageUrl}
            initialLanguage={language}
            questions={questions}
            questionMode={project.questionMode}
            isCompleted={Boolean(invitee.submission?.completedAt)}
            existingPhotoUrl={invitee.submission?.mediaAssets[0]?.url ?? null}
            existingDateLocation={invitee.submission?.dateLocation ?? null}
            existingBlessingText={invitee.submission?.blessingText ?? null}
            existingBlessingSignedBy={invitee.submission?.blessingSignedBy ?? invitee.name}
          />
        </main>
      </div>
    </>
  );
}
