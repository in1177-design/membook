"use client";

import { useRef, useState } from "react";
import { updateCoverImagePosition } from "../../../lib/actions";
import { HeroWave } from "./SubmissionBook";

// The hero's fixed height in BOOK_STYLES (.sub-mobile-hero img) — used to
// convert a drag distance in pixels into a percentage of object-position.
const HERO_HEIGHT_PX = 230;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

// Admin-preview-only, draggable stand-in for MobileHero's intro-step cover
// photo (see SubmissionWizard.tsx: only rendered when previewMode && a
// projectId is available — never for a real guest). Renders the identical
// .sub-mobile-hero markup itself (rather than wrapping MobileHero) so the
// drag layer and button can sit inside the same positioned container as an
// overlay, matching exactly what a real guest sees underneath.
export default function AdjustableCoverHero({
  projectId,
  src,
  initialPositionY,
  onPositionChange,
}: {
  projectId: string;
  src: string | null | undefined;
  initialPositionY: number;
  // Fires live as the admin drags, so a parent that renders this same photo
  // elsewhere on the same page (e.g. BuildPage's other step tabs) can stay
  // in sync without waiting for a full reload.
  onPositionChange?: (positionY: number) => void;
}) {
  const [positionY, setPositionY] = useState(initialPositionY);
  const [mode, setMode] = useState<"idle" | "adjusting">("idle");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const dragOrigin = useRef<{ clientY: number; positionY: number } | null>(null);

  if (!src) return null;

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragOrigin.current = { clientY: e.clientY, positionY };
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragOrigin.current) return;
    const deltaY = e.clientY - dragOrigin.current.clientY;
    const next = clamp(dragOrigin.current.positionY - (deltaY / HERO_HEIGHT_PX) * 100, 0, 100);
    setPositionY(next);
    onPositionChange?.(next);
  }

  async function handlePointerUp() {
    if (!dragOrigin.current) return;
    dragOrigin.current = null;
    setStatus("saving");
    try {
      await updateCoverImagePosition(projectId, positionY);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="sub-mobile-hero">
      <img src={src} alt="" style={{ objectPosition: `50% ${positionY}%` }} />
      {mode === "adjusting" && (
        <div
          className="sub-cover-fit-draglayer"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
      )}
      <button
        type="button"
        className="sub-cover-fit-btn"
        aria-pressed={mode === "adjusting"}
        onClick={() => setMode((m) => (m === "idle" ? "adjusting" : "idle"))}
      >
        {mode === "adjusting" ? "סיימתי" : "התאם תמונה"}
      </button>
      {mode === "adjusting" && status !== "idle" && (
        <span className="sub-cover-fit-status">
          {status === "saving" && "שומר..."}
          {status === "saved" && "נשמר"}
          {status === "error" && "שגיאה בשמירה, נסי שוב"}
        </span>
      )}
      <HeroWave />
    </div>
  );
}
