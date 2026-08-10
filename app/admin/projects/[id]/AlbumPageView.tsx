"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BookTextPage, PhotoPage, MobileHero, BOOK_STYLES } from "../../../i/[token]/SubmissionBook";
import { WIZARD_EXTRA_STYLES } from "../../../i/[token]/SubmissionWizard";
import { CONTENT } from "../../../i/[token]/content";
import type { Lang } from "../../../i/[token]/types";
import {
  addInviteeMediaAsset,
  deleteMediaAsset,
  updateSubmissionBlessing,
  updateSubmissionAnswer,
  updateSubmissionAdditionalText,
} from "../../../../lib/actions";

type Photo = { id: string; url: string };

type QuestionRef = {
  id: string;
  textHe: string;
  textRu: string | null;
  textEn: string | null;
  helperTextHe: string | null;
  helperTextRu: string | null;
  helperTextEn: string | null;
};

type Props = {
  inviteeId: string;
  projectId: string;
  lang: Lang;
  questions: QuestionRef[];
  answers: Record<string, string>;
  dateLocation: string | null;
  blessingText: string | null;
  blessingSignedBy: string | null;
  additionalText: string | null;
  photo: Photo | null;
  onClose: () => void;
};

// "תצוגת דף אלבום" — reuses the exact same review-screen component real
// guests see on Step 5, fed with this invitee's real submission, so the admin
// sees precisely what the guest saw before sending. Unlike SubmissionBook's
// default export (which only supports a single photo-overlay button), this
// assembles BookTextPage/PhotoPage/MobileHero directly — same approach
// BuildPage.tsx already uses — so it can render its own two-button photo
// overlay ("החלפת תמונה"/"מחיקת תמונה") matching the design. Blessing and
// answer text are editable in place via BookTextPage's editable* props,
// saving directly onto the invitee's one real Submission (upsert by
// inviteeId — never a duplicate).
export default function AlbumPageView({
  inviteeId,
  projectId,
  lang,
  questions,
  answers,
  dateLocation,
  blessingText,
  blessingSignedBy,
  additionalText,
  photo: initialPhoto,
  onClose,
}: Props) {
  const router = useRouter();
  const [photo, setPhoto] = useState<Photo | null>(initialPhoto);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [blessingTextState, setBlessingTextState] = useState(blessingText ?? "");
  const [blessingSignedByState, setBlessingSignedByState] = useState(blessingSignedBy ?? "");
  const [answersState, setAnswersState] = useState<Record<string, string>>(answers);
  const [additionalTextState, setAdditionalTextState] = useState(additionalText ?? "");

  async function saveBlessing() {
    await updateSubmissionBlessing(inviteeId, projectId, blessingTextState, blessingSignedByState);
    router.refresh();
  }

  async function saveAnswer(questionId: string) {
    await updateSubmissionAnswer(inviteeId, projectId, questionId, answersState[questionId] ?? "");
    router.refresh();
  }

  async function saveAdditionalText() {
    await updateSubmissionAdditionalText(inviteeId, projectId, additionalTextState);
    router.refresh();
  }

  // The real guest-facing book always shows only mediaAssets[0] (see
  // app/i/[token]/page.tsx) — app/api/submissions/route.ts's own guest-side
  // upload replaces rather than accumulates for the same reason. Mirrored
  // here: uploading a new photo from this admin toolbar deletes whatever was
  // there first, so what the admin just uploaded is guaranteed to be what
  // actually shows here (and to the guest) — never a second, invisible row.
  async function handleUpload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const signRes = await fetch("/api/admin/invitee-photo-sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteeId, projectId }),
      });
      if (!signRes.ok) throw new Error("לא הצלחנו להתחיל את העלאת התמונה");
      const sign = await signRes.json();

      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("api_key", sign.apiKey);
      uploadData.append("timestamp", String(sign.timestamp));
      uploadData.append("signature", sign.signature);
      uploadData.append("folder", sign.folder);
      uploadData.append("public_id", sign.publicId);
      uploadData.append("tags", sign.tag);

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`, {
        method: "POST",
        body: uploadData,
      });
      if (!uploadRes.ok) throw new Error("העלאת התמונה נכשלה");
      const uploaded = await uploadRes.json();

      if (photo) {
        await deleteMediaAsset(photo.id, projectId);
      }
      const created = await addInviteeMediaAsset(inviteeId, projectId, {
        cloudinaryPublicId: uploaded.public_id,
        url: uploaded.secure_url,
        width: uploaded.width,
        height: uploaded.height,
        format: uploaded.format,
      });

      setPhoto({ id: created.id, url: created.url });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "משהו השתבש, נסי שוב");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete() {
    if (!photo) return;
    if (!window.confirm("למחוק את התמונה הזו?")) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteMediaAsset(photo.id, projectId);
      setPhoto(null);
      router.refresh();
    } catch {
      setError("מחיקת התמונה נכשלה, נסי שוב");
    } finally {
      setDeleting(false);
    }
  }

  const photoOverlay = (
    <div
      style={{
        position: "absolute",
        bottom: 14,
        insetInlineStart: 14,
        insetInlineEnd: 14,
        zIndex: 2,
        display: "flex",
        gap: 8,
        justifyContent: "center",
      }}
    >
      <button type="button" onClick={handleDelete} disabled={!photo || deleting} className="sub-album-photo-btn">
        {deleting ? "מוחקת..." : "מחיקת תמונה"}
      </button>
      <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="sub-album-photo-btn">
        {uploading ? "מעלה..." : photo ? "החלפת תמונה" : "העלאת תמונה"}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.heic,.heif"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) handleUpload(file);
        }}
      />
    </div>
  );

  const mappedQuestions = questions.map((q) => ({
    id: q.id,
    textHe: q.textHe,
    textRu: q.textRu ?? undefined,
    textEn: q.textEn ?? undefined,
    helperTextHe: q.helperTextHe ?? undefined,
    helperTextRu: q.helperTextRu ?? undefined,
    helperTextEn: q.helperTextEn ?? undefined,
    existingAnswer: "",
  }));

  return (
    <div>
      <style>{`${BOOK_STYLES}${WIZARD_EXTRA_STYLES}
        /* White pill buttons overlaid on the photo (admin-only, matches the
           design sketch) — distinct from the single dark translucent pill
           (.sub-preview-photo-edit-btn) the real guest wizard uses, since
           there are two actions here instead of one. */
        .sub-album-photo-btn {
          padding: 8px 14px; border-radius: 999px; border: none; background: white; color: #333;
          font-size: 12px; font-weight: 700; cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,0.18);
        }
        .sub-album-photo-btn:disabled { opacity: 0.5; cursor: default; }
        /* BookTextPage skips .sub-page-form-bottom entirely in admin edit
           mode (no "back to editing"/send button here — Modal.tsx's own ✕
           closes this), but BOOK_STYLES' mobile-default .sub-page-form-scroll
           still reserves 180px of bottom padding to clear that now-absent
           fixed footer. Safety net for a narrow browser window where Modal's
           ~1040px panel still ends up under BOOK_STYLES' 860px container-query
           breakpoint (the mobile layout, where that padding rule applies). */
        .sub-album-page-embed .sub-page-form-scroll { padding-bottom: 0; }
      `}</style>
      <div className="sub-book-outer sub-album-page-embed">
        <MobileHero src={photo?.url ?? null} />
        <div className="sub-book">
          <BookTextPage
            content={CONTENT}
            lang={lang}
            answers={answersState}
            questions={mappedQuestions}
            dateLocation={dateLocation ?? ""}
            blessingText={blessingTextState}
            blessingSignedBy={blessingSignedByState}
            onBackToEdit={onClose}
            onConfirm={() => {}}
            isSubmitting={false}
            error={null}
            stepNumber={5}
            stepTotal={5}
            isSubmittedView
            editableBlessing={{ value: blessingTextState, onChange: setBlessingTextState, onBlur: saveBlessing }}
            editableSignedBy={{ value: blessingSignedByState, onChange: setBlessingSignedByState, onBlur: saveBlessing }}
            editableAnswers={Object.fromEntries(
              mappedQuestions.map((q) => [
                q.id,
                {
                  value: answersState[q.id] ?? "",
                  onChange: (v: string) => setAnswersState((prev) => ({ ...prev, [q.id]: v })),
                  onBlur: () => saveAnswer(q.id),
                },
              ])
            )}
            editableAdditionalText={{ value: additionalTextState, onChange: setAdditionalTextState, onBlur: saveAdditionalText }}
            pageCaption={{
              label: "תצוגת נתוני משתמש",
              description: "כך ייראו הנתונים שהוזנו על ידי המשתמש.,",
            }}
          />
          <div className="sub-spine" />
          <PhotoPage photoUrl={photo?.url ?? null} overlay={photoOverlay} />
        </div>
      </div>
      {error && <p style={{ color: "#b00020", fontSize: 12, margin: "8px 0 0" }}>{error}</p>}
    </div>
  );
}
