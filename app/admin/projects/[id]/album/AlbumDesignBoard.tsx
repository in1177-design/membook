"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { reorderSubmissions } from "../../../../../lib/actions";
import { isLowResForPrint } from "../../../../../lib/photoQuality";

type Spread = {
  submissionId: string;
  inviteeName: string;
  photoUrl: string | null;
  photoWidth: number | null;
  photoHeight: number | null;
};

export default function AlbumDesignBoard({ projectId, initialSpreads }: { projectId: string; initialSpreads: Spread[] }) {
  const router = useRouter();
  const [spreads, setSpreads] = useState(initialSpreads);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const savingRef = useRef(false);

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
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
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
          style={{
            cursor: "grab",
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
          <div style={{ position: "relative", aspectRatio: "3 / 4", background: "#f7f6f4" }}>
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
          <div style={{ padding: "8px 10px", fontSize: 12, fontWeight: 600, color: "#444", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {spread.inviteeName}
          </div>
        </div>
      ))}
    </div>
  );
}
