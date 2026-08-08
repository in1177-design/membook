"use server";

import { randomBytes, createHash } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import type { Language, QuestionMode } from "../generated/prisma/client";
import { extractSpreadsheetId, parseCsv, guessNamePhoneColumns, rowsLookLikeHeader, normalizeIsraeliPhone } from "./googleSheet";

function generateToken(): string {
  return randomBytes(16).toString("base64url"); // 128 bits, ~22 chars
}

function toLanguage(value: FormDataEntryValue | null): Language {
  return value === "RU" || value === "EN" ? value : "HE";
}

function toQuestionMode(value: FormDataEntryValue | null): QuestionMode {
  return value === "PICK_ONE" ? "PICK_ONE" : "ALL";
}

export async function createProject(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("שם הפרויקט חובה");

  const eventTypeSelect = String(formData.get("eventType") ?? "").trim();
  const eventTypeNew = String(formData.get("eventTypeNew") ?? "").trim();
  const eventType = (eventTypeSelect === "__new__" ? eventTypeNew : eventTypeSelect) || null;

  const celebrantNames = String(formData.get("celebrantNames") ?? "").trim() || null;
  const customerName = String(formData.get("customerName") ?? "").trim() || null;
  const customerPhone = String(formData.get("customerPhone") ?? "").trim() || null;
  const eventDateRaw = String(formData.get("eventDate") ?? "").trim();
  const eventDate = eventDateRaw ? new Date(eventDateRaw) : null;
  const submissionDeadlineRaw = String(formData.get("submissionDeadline") ?? "").trim();
  const submissionDeadline = submissionDeadlineRaw ? new Date(submissionDeadlineRaw) : null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const coverImageUrl = String(formData.get("coverImageUrl") ?? "").trim() || null;
  const defaultLanguage = toLanguage(formData.get("defaultLanguage"));
  const questionMode = toQuestionMode(formData.get("questionMode"));
  const introTextHe = String(formData.get("introTextHe") ?? "").trim() || null;
  const introTextRu = String(formData.get("introTextRu") ?? "").trim() || null;
  const introTextEn = String(formData.get("introTextEn") ?? "").trim() || null;
  const saveIntroAsTemplate = formData.get("saveIntroAsTemplate") === "on";
  const photoRequestTextHe = String(formData.get("photoRequestTextHe") ?? "").trim() || null;
  const photoRequestTextRu = String(formData.get("photoRequestTextRu") ?? "").trim() || null;
  const photoRequestTextEn = String(formData.get("photoRequestTextEn") ?? "").trim() || null;
  const blessingPromptTextHe = String(formData.get("blessingPromptTextHe") ?? "").trim() || null;
  const blessingPromptTextRu = String(formData.get("blessingPromptTextRu") ?? "").trim() || null;
  const blessingPromptTextEn = String(formData.get("blessingPromptTextEn") ?? "").trim() || null;

  const project = await prisma.project.create({
    data: {
      name,
      celebrantNames,
      eventType,
      customerName,
      customerPhone,
      eventDate,
      submissionDeadline,
      notes,
      coverImageUrl,
      defaultLanguage,
      questionMode,
      introTextHe,
      introTextRu,
      introTextEn,
      photoRequestTextHe,
      photoRequestTextRu,
      photoRequestTextEn,
      blessingPromptTextHe,
      blessingPromptTextRu,
      blessingPromptTextEn,
    },
  });

  const questionTexts = formData.getAll("questionText").map((v) => String(v).trim());
  const questionTextsRu = formData.getAll("questionTextRu").map((v) => String(v).trim());
  const questionTextsEn = formData.getAll("questionTextEn").map((v) => String(v).trim());
  const questionHelpers = formData.getAll("questionHelper").map((v) => String(v).trim());
  const questionHelpersRu = formData.getAll("questionHelperRu").map((v) => String(v).trim());
  const questionHelpersEn = formData.getAll("questionHelperEn").map((v) => String(v).trim());

  for (let i = 0; i < questionTexts.length; i++) {
    const text = questionTexts[i];
    if (!text) continue;
    const helper = questionHelpers[i] || null;
    const helperRu = questionHelpersRu[i] || null;
    const helperEn = questionHelpersEn[i] || null;
    const textRu = questionTextsRu[i] || null;
    const textEn = questionTextsEn[i] || null;

    await prisma.question.create({
      data: { projectId: project.id, sortOrder: i, textHe: text, textRu, textEn, helperTextHe: helper, helperTextRu: helperRu, helperTextEn: helperEn },
    });

    const existingTemplate = await prisma.questionTemplate.findFirst({ where: { textHe: text } });
    if (!existingTemplate) {
      await prisma.questionTemplate.create({ data: { textHe: text, textRu, textEn, helperTextHe: helper, helperTextRu: helperRu, helperTextEn: helperEn } });
    }
  }

  if (introTextHe && saveIntroAsTemplate) {
    const existingIntro = await prisma.introTemplate.findFirst({ where: { textHe: introTextHe } });
    if (!existingIntro) {
      await prisma.introTemplate.create({ data: { label: eventType ?? name, textHe: introTextHe, textRu: introTextRu, textEn: introTextEn } });
    }
  }

  revalidatePath("/admin/projects");
  redirect(`/admin/projects/${project.id}`);
}

export async function updateProjectDetails(projectId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("שם הפרויקט חובה");

  const eventTypeSelect = String(formData.get("eventType") ?? "").trim();
  const eventTypeNew = String(formData.get("eventTypeNew") ?? "").trim();
  const eventType = (eventTypeSelect === "__new__" ? eventTypeNew : eventTypeSelect) || null;

  const celebrantNames = String(formData.get("celebrantNames") ?? "").trim() || null;
  const customerName = String(formData.get("customerName") ?? "").trim() || null;
  const customerPhone = String(formData.get("customerPhone") ?? "").trim() || null;
  const eventDateRaw = String(formData.get("eventDate") ?? "").trim();
  const eventDate = eventDateRaw ? new Date(eventDateRaw) : null;
  const submissionDeadlineRaw = String(formData.get("submissionDeadline") ?? "").trim();
  const submissionDeadline = submissionDeadlineRaw ? new Date(submissionDeadlineRaw) : null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const coverImageUrl = String(formData.get("coverImageUrl") ?? "").trim() || null;
  const questionMode = toQuestionMode(formData.get("questionMode"));
  const introTextHe = String(formData.get("introTextHe") ?? "").trim() || null;
  const introTextRu = String(formData.get("introTextRu") ?? "").trim() || null;
  const introTextEn = String(formData.get("introTextEn") ?? "").trim() || null;
  const saveIntroAsTemplate = formData.get("saveIntroAsTemplate") === "on";
  const photoRequestTextHe = String(formData.get("photoRequestTextHe") ?? "").trim() || null;
  const photoRequestTextRu = String(formData.get("photoRequestTextRu") ?? "").trim() || null;
  const photoRequestTextEn = String(formData.get("photoRequestTextEn") ?? "").trim() || null;
  const blessingPromptTextHe = String(formData.get("blessingPromptTextHe") ?? "").trim() || null;
  const blessingPromptTextRu = String(formData.get("blessingPromptTextRu") ?? "").trim() || null;
  const blessingPromptTextEn = String(formData.get("blessingPromptTextEn") ?? "").trim() || null;

  const questionIds = formData.getAll("questionId").map((v) => String(v).trim());
  const questionTexts = formData.getAll("questionText").map((v) => String(v).trim());
  const questionTextsRu = formData.getAll("questionTextRu").map((v) => String(v).trim());
  const questionTextsEn = formData.getAll("questionTextEn").map((v) => String(v).trim());
  const questionHelpers = formData.getAll("questionHelper").map((v) => String(v).trim());
  const questionHelpersRu = formData.getAll("questionHelperRu").map((v) => String(v).trim());
  const questionHelpersEn = formData.getAll("questionHelperEn").map((v) => String(v).trim());
  const submittedIds = new Set(questionIds.filter(Boolean));

  try {
    await prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id: projectId },
        data: {
          name,
          celebrantNames,
          eventType,
          customerName,
          customerPhone,
          eventDate,
          submissionDeadline,
          notes,
          coverImageUrl,
          questionMode,
          introTextHe,
          introTextRu,
          introTextEn,
          photoRequestTextHe,
          photoRequestTextRu,
          photoRequestTextEn,
          blessingPromptTextHe,
          blessingPromptTextRu,
          blessingPromptTextEn,
        },
      });

      // Rows removed in the UI simply don't appear in submittedIds — delete those.
      const existingQuestions = await tx.question.findMany({ where: { projectId }, select: { id: true } });
      for (const q of existingQuestions) {
        if (!submittedIds.has(q.id)) {
          await tx.question.delete({ where: { id: q.id } });
        }
      }

      let sortOrder = await tx.question.count({ where: { projectId } });

      for (let i = 0; i < questionTexts.length; i++) {
        const text = questionTexts[i];
        if (!text) continue;
        const helper = questionHelpers[i] || null;
        const helperRu = questionHelpersRu[i] || null;
        const helperEn = questionHelpersEn[i] || null;
        const textRu = questionTextsRu[i] || null;
        const textEn = questionTextsEn[i] || null;
        const id = questionIds[i];

        if (id) {
          await tx.question.update({
            where: { id },
            data: { textHe: text, textRu, textEn, helperTextHe: helper, helperTextRu: helperRu, helperTextEn: helperEn },
          });
        } else {
          await tx.question.create({
            data: { projectId, sortOrder: sortOrder++, textHe: text, textRu, textEn, helperTextHe: helper, helperTextRu: helperRu, helperTextEn: helperEn },
          });
        }
      }
    });
  } catch (err) {
    const code = (err as { code?: string } | null)?.code;
    if (code === "P2003" || code === "P2014") {
      throw new Error("לא ניתן להסיר שאלה שכבר יש לה תשובות ממוזמנים");
    }
    throw err;
  }

  for (let i = 0; i < questionTexts.length; i++) {
    const text = questionTexts[i];
    if (!text || questionIds[i]) continue;
    const existingTemplate = await prisma.questionTemplate.findFirst({ where: { textHe: text } });
    if (!existingTemplate) {
      await prisma.questionTemplate.create({
        data: {
          textHe: text,
          textRu: questionTextsRu[i] || null,
          textEn: questionTextsEn[i] || null,
          helperTextHe: questionHelpers[i] || null,
          helperTextRu: questionHelpersRu[i] || null,
          helperTextEn: questionHelpersEn[i] || null,
        },
      });
    }
  }

  if (introTextHe && saveIntroAsTemplate) {
    const existingIntro = await prisma.introTemplate.findFirst({ where: { textHe: introTextHe } });
    if (!existingIntro) {
      await prisma.introTemplate.create({ data: { label: eventType ?? name, textHe: introTextHe, textRu: introTextRu, textEn: introTextEn } });
    }
  }

  revalidatePath("/admin/projects");
  revalidatePath(`/admin/projects/${projectId}`);
}

// Lightweight, single-purpose update for the step-by-step "build" page — saves
// just the guest-facing headline/intro text on blur. Deliberately separate from
// updateProjectDetails: that action expects the *entire* form each time and
// deletes any question not resubmitted, so driving it from a page that only
// edits two fields risks silently wiping the question bank. This one only ever
// touches the fields explicitly passed in.
// Narrow, additive-only counterpart to updateProjectDetails' question handling —
// used by the build page's Step 3 (questions) editor. Deliberately never
// deletes a question (no remove control in that editor yet) and never
// touches helperText* (not editable there), so it can't silently wipe data
// the old settings-page QuestionsBuilder set. Returns the resulting id for
// each input row (unchanged if it had one, freshly created otherwise, or the
// same value passed in if the row was skipped for having no Hebrew text) so
// the client can sync newly-created ids into its state without a full refetch.
export async function updateProjectQuestions(
  projectId: string,
  questions: { id: string | null; textHe: string; textRu: string; textEn: string }[]
): Promise<{ ids: (string | null)[] }> {
  const ids: (string | null)[] = [];
  await prisma.$transaction(async (tx) => {
    let sortOrder = await tx.question.count({ where: { projectId } });
    for (const q of questions) {
      const textHe = q.textHe.trim();
      if (!textHe) {
        ids.push(q.id);
        continue;
      }
      const textRu = q.textRu.trim() || null;
      const textEn = q.textEn.trim() || null;
      if (q.id) {
        await tx.question.update({ where: { id: q.id }, data: { textHe, textRu, textEn } });
        ids.push(q.id);
      } else {
        const created = await tx.question.create({ data: { projectId, sortOrder: sortOrder++, textHe, textRu, textEn } });
        ids.push(created.id);
      }
    }
  });
  revalidatePath(`/admin/projects/${projectId}/build`);
  return { ids };
}

// Deletes a single question from the build page's Step 3 editor. Refuses to
// delete a question any guest has already answered — Answer.question has no
// cascade delete on purpose, so this would otherwise fail with a foreign-key
// error; surfacing a clear reason is friendlier than a raw DB error.
export async function deleteProjectQuestion(
  projectId: string,
  questionId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question || question.projectId !== projectId) {
    return { ok: false, error: "השאלה לא נמצאה" };
  }
  const answerCount = await prisma.answer.count({ where: { questionId } });
  if (answerCount > 0) {
    return { ok: false, error: "לא ניתן למחוק שאלה שכבר נענתה על ידי מוזמנים" };
  }
  await prisma.question.delete({ where: { id: questionId } });
  revalidatePath(`/admin/projects/${projectId}/build`);
  return { ok: true };
}

export async function updateProjectGuestText(
  projectId: string,
  fields: {
    guestHeadlineHe?: string | null;
    guestHeadlineRu?: string | null;
    guestHeadlineEn?: string | null;
    introTextHe?: string | null;
    introTextRu?: string | null;
    introTextEn?: string | null;
    blessingPromptTextHe?: string | null;
    blessingPromptTextRu?: string | null;
    blessingPromptTextEn?: string | null;
    photoRequestTextHe?: string | null;
    photoRequestTextRu?: string | null;
    photoRequestTextEn?: string | null;
  }
) {
  await prisma.project.update({ where: { id: projectId }, data: fields });
  revalidatePath(`/admin/projects/${projectId}/build`);
}

// Only offered in the UI once a project is CLOSED, as a deliberate, irreversible
// cleanup step — not something available on active projects.
export async function deleteProject(projectId: string) {
  await prisma.project.delete({ where: { id: projectId } });
  revalidatePath("/admin/projects");
}

export async function addInvitee(projectId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("שם המוזמן חובה");

  const relationSelect = String(formData.get("relation") ?? "").trim();
  const relationOther = String(formData.get("relationOther") ?? "").trim();
  const relation = (relationSelect === "__other__" ? relationOther : relationSelect) || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const name2 = String(formData.get("name2") ?? "").trim() || null;
  const phone2 = String(formData.get("phone2") ?? "").trim() || null;
  const languageRaw = formData.get("language");
  const language = languageRaw ? toLanguage(languageRaw) : null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  await prisma.invitee.create({
    data: {
      projectId,
      name,
      relation,
      phone,
      name2,
      phone2,
      language,
      notes,
      inviteLink: {
        create: { token: generateToken() },
      },
    },
  });

  revalidatePath(`/admin/projects/${projectId}`);
}

export async function deleteInvitee(inviteeId: string, projectId: string) {
  await prisma.invitee.delete({ where: { id: inviteeId } });
  revalidatePath(`/admin/projects/${projectId}`);
}

export async function updateInvitee(inviteeId: string, projectId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("שם המוזמן חובה");

  const relationSelect = String(formData.get("relation") ?? "").trim();
  const relationOther = String(formData.get("relationOther") ?? "").trim();
  const relation = (relationSelect === "__other__" ? relationOther : relationSelect) || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const name2 = String(formData.get("name2") ?? "").trim() || null;
  const phone2 = String(formData.get("phone2") ?? "").trim() || null;
  const languageRaw = formData.get("language");
  const language = languageRaw ? toLanguage(languageRaw) : null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  await prisma.invitee.update({
    where: { id: inviteeId },
    data: { name, relation, phone, name2, phone2, language, notes },
  });

  revalidatePath(`/admin/projects/${projectId}`);
}

// Inline updates from the invitees table chips — no form/drawer involved.
export async function updateInviteeAttending(inviteeId: string, projectId: string, attending: "YES" | "NO" | "MAYBE") {
  await prisma.invitee.update({ where: { id: inviteeId }, data: { attending } });
  revalidatePath(`/admin/projects/${projectId}`);
}

export async function updateInviteeLanguage(inviteeId: string, projectId: string, language: "HE" | "RU" | "EN") {
  await prisma.invitee.update({ where: { id: inviteeId }, data: { language } });
  revalidatePath(`/admin/projects/${projectId}`);
}

export async function markInviteSent(inviteLinkId: string, projectId: string) {
  await prisma.inviteLink.update({
    where: { id: inviteLinkId },
    data: { sentAt: new Date() },
  });
  revalidatePath(`/admin/projects/${projectId}`);
}

export async function setProjectStatus(projectId: string, status: "ACTIVE" | "CLOSED") {
  await prisma.project.update({
    where: { id: projectId },
    data: { status },
  });
  revalidatePath(`/admin/projects/${projectId}`);
}

export async function revokeInviteLink(inviteLinkId: string, projectId: string) {
  await prisma.inviteLink.update({
    where: { id: inviteLinkId },
    data: { revokedAt: new Date() },
  });
  revalidatePath(`/admin/projects/${projectId}`);
}

// Reissuing reuses the same InviteLink row (an Invitee can only have one) with a
// fresh token, so the old link stops working immediately and tracking starts clean.
export async function regenerateInviteLink(inviteLinkId: string, projectId: string) {
  await prisma.inviteLink.update({
    where: { id: inviteLinkId },
    data: {
      token: generateToken(),
      revokedAt: null,
      sentAt: null,
      firstViewedAt: null,
      lastViewedAt: null,
    },
  });
  revalidatePath(`/admin/projects/${projectId}`);
}

// Lets the admin attach a photo to an invitee before they've ever opened their
// link (or on their behalf afterwards) — upserts the Submission since one may
// not exist yet.
export async function addInviteeMediaAsset(
  inviteeId: string,
  projectId: string,
  mediaAsset: {
    cloudinaryPublicId: string;
    url: string;
    width?: number | null;
    height?: number | null;
    format?: string | null;
  }
) {
  const submission = await prisma.submission.upsert({
    where: { inviteeId },
    create: { inviteeId },
    update: {},
  });
  const created = await prisma.mediaAsset.create({
    data: { submissionId: submission.id, ...mediaAsset },
  });
  revalidatePath(`/admin/projects/${projectId}`);
  return created;
}

export async function deleteMediaAsset(mediaAssetId: string, projectId: string) {
  const asset = await prisma.mediaAsset.findUnique({ where: { id: mediaAssetId } });
  if (!asset) return;

  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

  if (apiKey && apiSecret && cloudName) {
    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign: Record<string, string | number> = { public_id: asset.cloudinaryPublicId, timestamp };
    const sortedString = Object.keys(paramsToSign)
      .sort()
      .map((key) => `${key}=${paramsToSign[key]}`)
      .join("&");
    const signature = createHash("sha1").update(sortedString + apiSecret).digest("hex");

    // Best-effort: don't let a Cloudinary hiccup block removing the row the admin asked to delete.
    await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        public_id: asset.cloudinaryPublicId,
        api_key: apiKey,
        timestamp: String(timestamp),
        signature,
      }),
    }).catch(() => {});
  }

  await prisma.mediaAsset.delete({ where: { id: mediaAssetId } });
  revalidatePath(`/admin/projects/${projectId}`);
}

// Fetches a Google Sheet as CSV via its public export endpoint (works with no
// API key/OAuth as long as the sheet is shared "Anyone with the link can
// view") and returns guessed name/phone candidates for the admin to review
// before anything is written to the DB. Rows whose phone already belongs to
// an invitee in this project are dropped, so re-uploading a sheet that grew
// since the last import only surfaces the new people.
export async function previewGoogleSheetInvitees(
  sheetUrl: string,
  projectId: string
): Promise<{ rows: { name: string; phone: string }[]; skippedDuplicates: number }> {
  let url: URL;
  try {
    url = new URL(sheetUrl.trim());
  } catch {
    throw new Error("הקישור לא תקין");
  }
  if (url.hostname !== "docs.google.com") {
    throw new Error("זה לא נראה כמו קישור לגיליון Google Sheets");
  }

  const sheetId = extractSpreadsheetId(url.pathname);
  if (!sheetId) {
    throw new Error("לא הצלחנו לזהות מזהה גיליון בקישור");
  }

  const gid = url.hash.match(/gid=(\d+)/)?.[1] ?? url.searchParams.get("gid");
  const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gid ? `&gid=${gid}` : ""}`;

  const res = await fetch(exportUrl);
  const contentType = res.headers.get("content-type") ?? "";
  if (!res.ok || contentType.includes("text/html")) {
    throw new Error("לא ניתן לגשת לגיליון. ודאי שהשיתוף מוגדר ל\"כל מי שיש לו את הקישור יכול לצפות\"");
  }

  const csvText = await res.text();
  const rows = parseCsv(csvText);
  if (rows.length === 0) return { rows: [], skippedDuplicates: 0 };

  const hasHeader = rowsLookLikeHeader(rows[0]);
  const { nameIdx, phoneIdx } = guessNamePhoneColumns(rows[0]);
  const dataRows = hasHeader ? rows.slice(1) : rows;

  const candidates = dataRows
    .map((r) => ({ name: (r[nameIdx] ?? "").trim(), phone: normalizeIsraeliPhone(r[phoneIdx] ?? "") }))
    .filter((r) => r.name);

  const existing = await prisma.invitee.findMany({ where: { projectId }, select: { phone: true } });
  const existingPhones = new Set(
    existing.map((i) => normalizeIsraeliPhone(i.phone ?? "")).filter((p) => p)
  );

  const fresh = candidates.filter((r) => !r.phone || !existingPhones.has(r.phone));

  return { rows: fresh, skippedDuplicates: candidates.length - fresh.length };
}

// Bulk-creates invitees from a reviewed/edited list (e.g. from the Google
// Sheets import preview). name2 is never sourced from the sheet — it's a
// manual field admins fill in during the preview step. Mirrors addInvitee's
// per-row shape (token per invitee), skipping rows without a name.
export async function bulkAddInvitees(
  projectId: string,
  rows: { name: string; phone: string; name2?: string; language?: string }[]
) {
  const valid = rows.filter((r) => r.name.trim());
  if (valid.length === 0) return { count: 0 };

  await prisma.$transaction(
    valid.map((r) =>
      prisma.invitee.create({
        data: {
          projectId,
          name: r.name.trim(),
          phone: normalizeIsraeliPhone(r.phone) || null,
          name2: r.name2?.trim() || null,
          language: r.language ? toLanguage(r.language) : null,
          inviteLink: { create: { token: generateToken() } },
        },
      })
    )
  );

  revalidatePath(`/admin/projects/${projectId}`);
  return { count: valid.length };
}

// Persists the drag-and-drop order set on the "עיצוב האלבום" screen. Takes the
// full ordered list of submission ids each time (simplest to keep in sync with
// a reorderable grid) and writes sortOrder = index for each.
export async function reorderSubmissions(projectId: string, orderedSubmissionIds: string[]) {
  await prisma.$transaction(
    orderedSubmissionIds.map((id, index) =>
      prisma.submission.update({ where: { id }, data: { sortOrder: index } })
    )
  );
  revalidatePath(`/admin/projects/${projectId}/album`);
}
