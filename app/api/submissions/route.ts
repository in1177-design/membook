import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const token = body?.token;
  const answers = body?.answers;
  const mediaAsset = body?.mediaAsset;
  const dateLocation = typeof body?.dateLocation === "string" ? body.dateLocation.trim() || null : undefined;
  const blessingText = typeof body?.blessingText === "string" ? body.blessingText.trim() || null : undefined;
  const blessingSignedBy = typeof body?.blessingSignedBy === "string" ? body.blessingSignedBy.trim() || null : undefined;
  // Missing kind (older client bundle mid-deploy) behaves exactly like today: a final submit.
  const kind: "autosave" | "final" = body?.kind === "autosave" ? "autosave" : "final";

  if (typeof token !== "string" || !Array.isArray(answers)) {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }

  const cleanMediaAsset =
    mediaAsset &&
    typeof mediaAsset.cloudinaryPublicId === "string" &&
    typeof mediaAsset.url === "string"
      ? {
          cloudinaryPublicId: mediaAsset.cloudinaryPublicId,
          url: mediaAsset.url,
          width: typeof mediaAsset.width === "number" ? mediaAsset.width : null,
          height: typeof mediaAsset.height === "number" ? mediaAsset.height : null,
          format: typeof mediaAsset.format === "string" ? mediaAsset.format : null,
        }
      : null;

  const inviteLink = await prisma.inviteLink.findUnique({
    where: { token },
    include: {
      invitee: {
        include: {
          project: { include: { questions: true } },
          submission: { include: { answers: true, mediaAssets: true } },
        },
      },
    },
  });

  if (!inviteLink || inviteLink.revokedAt) {
    return NextResponse.json({ error: "הקישור אינו תקף" }, { status: 404 });
  }

  const { invitee } = inviteLink;
  const { project } = invitee;

  if (project.status === "CLOSED") {
    return NextResponse.json({ error: "הפרויקט נסגר ולא ניתן לערוך יותר" }, { status: 403 });
  }

  const validQuestionIds = new Set(project.questions.map((q) => q.id));
  const cleanAnswers = answers
    .filter(
      (a: unknown): a is { questionId: string; text: string } =>
        typeof a === "object" &&
        a !== null &&
        typeof (a as { questionId?: unknown }).questionId === "string" &&
        typeof (a as { text?: unknown }).text === "string" &&
        validQuestionIds.has((a as { questionId: string }).questionId)
    )
    .map((a) => ({ questionId: a.questionId, text: a.text.trim() }))
    .filter((a) => a.text.length > 0);

  // The "must have something" guard only applies to the final submit — autosave calls
  // during the wizard (e.g. just a date/location, or answers already saved on blur) are
  // legitimately partial and shouldn't be rejected. The wizard's photo step autosaves the
  // media asset as soon as it's uploaded, so the final call itself often carries no new
  // answers/media of its own — check what's already persisted from earlier steps too.
  const hasExistingContent =
    Boolean(invitee.submission?.answers.some((a) => a.text.trim().length > 0)) ||
    Boolean(invitee.submission?.mediaAssets.length) ||
    Boolean(invitee.submission?.blessingText?.trim());
  if (
    kind === "final" &&
    cleanAnswers.length === 0 &&
    !cleanMediaAsset &&
    !blessingText &&
    !hasExistingContent
  ) {
    return NextResponse.json({ error: "צריך למלא לפחות תשובה אחת או להעלות תמונה" }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    const submission = await tx.submission.upsert({
      where: { inviteeId: invitee.id },
      create: {
        inviteeId: invitee.id,
        dateLocation: dateLocation ?? null,
        blessingText: blessingText ?? null,
        blessingSignedBy: blessingSignedBy ?? null,
        ...(kind === "final" ? { completedAt: new Date() } : {}),
      },
      update: {
        submittedAt: new Date(),
        ...(dateLocation !== undefined ? { dateLocation } : {}),
        ...(blessingText !== undefined ? { blessingText } : {}),
        ...(blessingSignedBy !== undefined ? { blessingSignedBy } : {}),
        ...(kind === "final" ? { completedAt: new Date() } : {}),
      },
    });

    for (const answer of cleanAnswers) {
      await tx.answer.upsert({
        where: { submissionId_questionId: { submissionId: submission.id, questionId: answer.questionId } },
        create: { submissionId: submission.id, questionId: answer.questionId, text: answer.text },
        update: { text: answer.text },
      });
    }

    if (cleanMediaAsset) {
      // Only one photo is ever shown/used today — replace rather than accumulate rows.
      await tx.mediaAsset.deleteMany({ where: { submissionId: submission.id } });
      await tx.mediaAsset.create({
        data: { submissionId: submission.id, ...cleanMediaAsset },
      });
    }
  });

  return NextResponse.json({ ok: true, completed: kind === "final" });
}
