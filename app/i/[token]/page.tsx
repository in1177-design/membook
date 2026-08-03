import { headers } from "next/headers";
import { prisma } from "../../../lib/prisma";
import { detectDeviceType, detectIsBot } from "../../../lib/tracking";
import { isPastGracePeriod } from "../../../lib/linkValidity";
import SubmissionWizard from "./SubmissionWizard";

export const dynamic = "force-dynamic";

export const CONTENT: Record<
  string,
  {
    eyebrow: string;
    intro: string;
    photoLabel: string;
    photoHint: string;
    submitLabel: string;
    dateLocationLabel: string;
    dateLocationPlaceholder: string;
    backToEditLabel: string;
    answersHeading: string;
    startLabel: string;
    nextLabel: string;
    backLabel: string;
  }
> = {
  HE: {
    eyebrow: "אלבום זיכרון",
    intro: "שמחים שהצטרפת! נשמח אם תעני על השאלות למטה.",
    photoLabel: "לחצי או גררי להעלאת תמונה",
    photoHint: "JPG · PNG · WEBP",
    submitLabel: "אישור ושליחה",
    dateLocationLabel: "תאריך ומקום",
    dateLocationPlaceholder: "למשל: יולי 2026 · תל אביב",
    backToEditLabel: "חזרה לעריכה",
    answersHeading: "הסיפור שלך",
    startLabel: "בואי נתחיל",
    nextLabel: "הבא",
    backLabel: "הקודם",
  },
  RU: {
    eyebrow: "Альбом памяти",
    intro: "Мы рады, что вы с нами! Пожалуйста, ответьте на вопросы ниже.",
    photoLabel: "Нажмите или перетащите фото сюда",
    photoHint: "JPG · PNG · WEBP",
    submitLabel: "Подтвердить и отправить",
    dateLocationLabel: "Дата и место",
    dateLocationPlaceholder: "напр. июль 2026 · Тель-Авив",
    backToEditLabel: "Вернуться к редактированию",
    answersHeading: "Ваша история",
    startLabel: "Начнём",
    nextLabel: "Далее",
    backLabel: "Назад",
  },
  EN: {
    eyebrow: "Memory album",
    intro: "So glad you're here! Please answer the questions below.",
    photoLabel: "Click or drag to upload",
    photoHint: "JPG · PNG · WEBP",
    submitLabel: "Confirm & submit",
    dateLocationLabel: "Date & location",
    dateLocationPlaceholder: "e.g. July 2026 · Tel Aviv",
    backToEditLabel: "Back to editing",
    answersHeading: "Your story",
    startLabel: "Let's begin",
    nextLabel: "Next",
    backLabel: "Back",
  },
};

// Fallback for the PICK_ONE-only, per-language photo-request and blessing
// guidance text, used when a project hasn't set its own wording yet — mirrors
// CONTENT.*.photoLabel since that's the closest existing equivalent.
export const PICK_ONE_FALLBACK_TEXT: Record<string, { photoRequest: string; blessingPrompt: string }> = {
  HE: { photoRequest: CONTENT.HE.photoLabel, blessingPrompt: "כמה מילים לברכה..." },
  RU: { photoRequest: CONTENT.RU.photoLabel, blessingPrompt: "Несколько слов поздравления..." },
  EN: { photoRequest: CONTENT.EN.photoLabel, blessingPrompt: "A few words of blessing..." },
};

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

  return (
    <>
      <style>{`
        .invitee-bg { background: #f3ece0; min-height: 100vh; }
      `}</style>
      <div className="invitee-bg">
        <main style={{ maxWidth: 1048, margin: "0 auto", padding: "40px 24px" }}>
          <SubmissionWizard
            token={token}
            projectName={project.name}
            content={CONTENT}
            introTexts={introTexts}
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
