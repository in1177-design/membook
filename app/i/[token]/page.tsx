import { headers } from "next/headers";
import { prisma } from "../../../lib/prisma";
import { detectDeviceType, detectIsBot } from "../../../lib/tracking";
import { isPastGracePeriod } from "../../../lib/linkValidity";
import SubmissionForm from "./SubmissionForm";

export const dynamic = "force-dynamic";

const CONTENT: Record<
  string,
  {
    eyebrow: string;
    intro: string;
    photoLabel: string;
    photoHint: string;
    submitLabel: string;
    draftLabel: string;
    dateLocationLabel: string;
    dateLocationPlaceholder: string;
    backToEditLabel: string;
    answersHeading: string;
  }
> = {
  HE: {
    eyebrow: "אלבום זיכרון",
    intro: "שמחים שהצטרפת! נשמח אם תעני על השאלות למטה.",
    photoLabel: "לחצי או גררי להעלאת תמונה",
    photoHint: "JPG · PNG · WEBP",
    submitLabel: "שליחה",
    draftLabel: "שמירה כטיוטה",
    dateLocationLabel: "תאריך ומקום",
    dateLocationPlaceholder: "למשל: יולי 2026 · תל אביב",
    backToEditLabel: "חזרה לעריכה",
    answersHeading: "הסיפור שלך",
  },
  RU: {
    eyebrow: "Альбом памяти",
    intro: "Мы рады, что вы с нами! Пожалуйста, ответьте на вопросы ниже.",
    photoLabel: "Нажмите или перетащите фото сюда",
    photoHint: "JPG · PNG · WEBP",
    submitLabel: "Отправить",
    draftLabel: "Сохранить черновик",
    dateLocationLabel: "Дата и место",
    dateLocationPlaceholder: "напр. июль 2026 · Тель-Авив",
    backToEditLabel: "Вернуться к редактированию",
    answersHeading: "Ваша история",
  },
  EN: {
    eyebrow: "Memory album",
    intro: "So glad you're here! Please answer the questions below.",
    photoLabel: "Click or drag to upload",
    photoHint: "JPG · PNG · WEBP",
    submitLabel: "Submit",
    draftLabel: "Save as draft",
    dateLocationLabel: "Date & location",
    dateLocationPlaceholder: "e.g. July 2026 · Tel Aviv",
    backToEditLabel: "Back to editing",
    answersHeading: "Your story",
  },
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

  return (
    <>
      <style>{`
        .invitee-bg { background: #f3ece0; min-height: 100vh; }
      `}</style>
      <div className="invitee-bg">
        <main style={{ maxWidth: 1048, margin: "0 auto", padding: "40px 24px" }}>
          <SubmissionForm
            token={token}
            projectName={project.name}
            content={CONTENT}
            introTexts={introTexts}
            initialLanguage={language}
            questions={questions}
            alreadySubmitted={Boolean(invitee.submission)}
            existingPhotoUrl={invitee.submission?.mediaAssets[0]?.url ?? null}
            existingDateLocation={invitee.submission?.dateLocation ?? null}
          />
        </main>
      </div>
    </>
  );
}
