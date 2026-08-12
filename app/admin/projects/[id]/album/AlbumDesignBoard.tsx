"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { reorderSubmissions } from "../../../../../lib/actions";
import { isLowResForPrint } from "../../../../../lib/photoQuality";
import Modal from "../../Modal";
import AlbumPageView from "../AlbumPageView";
import type { Lang } from "../../../../i/[token]/types";

type QuestionRef = {
  id: string;
  textHe: string;
  textRu: string | null;
  textEn: string | null;
  helperTextHe: string | null;
  helperTextRu: string | null;
  helperTextEn: string | null;
};

type Spread = {
  submissionId: string;
  inviteeId: string;
  inviteeName: string;
  language: string | null;
  photoId: string | null;
  photoUrl: string | null;
  photoWidth: number | null;
  photoHeight: number | null;
  dateLocation: string | null;
  blessingText: string | null;
  blessingSignedBy: string | null;
  additionalText: string | null;
  answers: Record<string, string>;
};

// Same fallback InviteesTable.tsx's toLangCode uses — an invitee's own
// language, or the project default if unset.
function toLangCode(value: string): Lang {
  return value === "RU" || value === "EN" ? value : "HE";
}

export default function AlbumDesignBoard({
  projectId,
  defaultLanguage,
  questions,
  initialSpreads,
}: {
  projectId: string;
  defaultLanguage: string;
  questions: QuestionRef[];
  initialSpreads: Spread[];
}) {
  const router = useRouter();
  const [spreads, setSpreads] = useState(initialSpreads);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const savingRef = useRef(false);
  // Same preview as the invitees table's "עיין" button — the real review
  // screen (AlbumPageView), fed with this spread's own submission data.
  // Tracked by index (not the spread object itself) so the modal's ‹/›
  // arrows can page to the adjacent spread without closing and reopening.
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const previewingSpread = previewIndex !== null ? spreads[previewIndex] : null;

  async function persist(order: Spread[]) {
    savingRef.current = true;
    try {
      await reorderSubmissions(
        projectId,
        order.map((s) => s.submissionId)
      );
      router.refresh();
    } finally {
      savingRef.current = false;
    }
  }

  function handleDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }
    const next = [...spreads];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    setSpreads(next);
    persist(next);
    setDragIndex(null);
    setOverIndex(null);
  }

  if (spreads.length === 0) {
    return (
      <div
        style={{
          padding: "60px 24px",
          textAlign: "center",
          color: "#999",
          background: "#fbfaf8",
          border: "1px dashed #e0ddd7",
          borderRadius: 16,
        }}
      >
        עדיין אין כפולות באלבום — הן יופיעו כאן ברגע שמוזמנים ישלחו תמונות ותשובות.
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 16,
        }}
      >
        {spreads.map((spread, index) => (
          <div
            key={spread.submissionId}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(e) => {
              e.preventDefault();
              if (overIndex !== index) setOverIndex(index);
            }}
            onDragLeave={() => setOverIndex((v) => (v === index ? null : v))}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(index);
            }}
            onDragEnd={() => {
              setDragIndex(null);
              setOverIndex(null);
            }}
            // Native HTML5 drag doesn't fire a click at the end of an actual
            // drag (mousedown→dragstart→…→dragend, no click in between) — a
            // plain tap without movement still does, so click-to-preview and
            // drag-to-reorder coexist on the same element without conflict.
            onClick={() => setPreviewIndex(index)}
            style={{
              cursor: "pointer",
              userSelect: "none",
              border: overIndex === index && dragIndex !== null ? "2px solid #e2703f" : "1px solid #ece9e4",
              borderRadius: 14,
              overflow: "hidden",
              background: "white",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              opacity: dragIndex === index ? 0.4 : 1,
              transition: "opacity 0.12s ease, border-color 0.12s ease",
            }}
          >
            <div style={{ position: "relative", aspectRatio: "1 / 1", background: "#f7f6f4" }}>
              {spread.photoUrl ? (
                <img
                  src={spread.photoUrl}
                  alt=""
                  draggable={false}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#b5b3ae" }}>
                  אין תמונה
                </div>
              )}
              <span
                style={{
                  position: "absolute",
                  top: 6,
                  insetInlineStart: 6,
                  fontSize: 10,
                  fontWeight: 700,
                  background: "rgba(0,0,0,0.55)",
                  color: "white",
                  borderRadius: 999,
                  padding: "2px 7px",
                }}
              >
                {index + 1}
              </span>
              {isLowResForPrint(spread.photoWidth, spread.photoHeight) && (
                <span
                  title="רזולוציית התמונה נמוכה — היא עלולה להיראות מטושטשת בהדפסה"
                  style={{
                    position: "absolute",
                    top: 6,
                    insetInlineEnd: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    background: "#c0392b",
                    color: "white",
                    borderRadius: 999,
                    width: 18,
                    height: 18,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    lineHeight: 1,
                  }}
                >
                  ⚠
                </span>
              )}
            </div>
            <div style={{ padding: "8px 10px" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#444", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {spread.inviteeName}
              </div>
              <div style={{ fontSize: 11, color: spread.blessingText ? "#888" : "#c4c1bb", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>
                {spread.blessingText ? `ברכה: ${spread.blessingText}` : "— אין ברכה —"}
              </div>
            </div>
          </div>
        ))}
      </div>

      {previewingSpread && previewIndex !== null && (
        <Modal
          onClose={() => setPreviewIndex(null)}
          onPrev={previewIndex > 0 ? () => setPreviewIndex(previewIndex - 1) : undefined}
          onNext={previewIndex < spreads.length - 1 ? () => setPreviewIndex(previewIndex + 1) : undefined}
        >
          <AlbumPageView
            // Remount on page-change — AlbumPageView seeds its own editable
            // state (blessing/answer text) from props via useState, which
            // React won't re-initialize on a prop change alone.
            key={previewingSpread.inviteeId}
            inviteeId={previewingSpread.inviteeId}
            projectId={projectId}
            lang={toLangCode(previewingSpread.language ?? defaultLanguage)}
            questions={questions}
            answers={previewingSpread.answers}
            dateLocation={previewingSpread.dateLocation}
            blessingText={previewingSpread.blessingText}
            blessingSignedBy={previewingSpread.blessingSignedBy}
            additionalText={previewingSpread.additionalText}
            photo={previewingSpread.photoId && previewingSpread.photoUrl ? { id: previewingSpread.photoId, url: previewingSpread.photoUrl } : null}
            onClose={() => setPreviewIndex(null)}
          />
        </Modal>
      )}
    </>
  );
}
