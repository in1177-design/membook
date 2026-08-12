"use client";

import { useEffect } from "react";

// Centered overlay — sibling to Drawer.tsx (same scrim/Escape/close-button
// conventions) but for content that needs to sit in the middle of the screen
// at a real width (e.g. AlbumPageView's book-page preview, which needs 860px+
// to trigger SubmissionBook's own desktop two-column layout) instead of an
// edge-docked side panel.
export default function Modal({
  onClose,
  children,
  onPrev,
  onNext,
}: {
  onClose: () => void;
  children: React.ReactNode;
  // Optional prev/next paging (album design board's "עיין" preview, paging
  // between spreads without closing/reopening the modal) — undefined means
  // no arrow in that direction (e.g. already at the first/last spread), not
  // just disabled, so callers that never page (InviteesTable's preview)
  // don't need to pass anything and get no arrows at all.
  onPrev?: () => void;
  onNext?: () => void;
}) {
  // Blurring before closing matters here specifically: AlbumPageView's
  // inline editing (SubmissionBook.tsx's editable* props) only saves
  // onBlur — closing via Escape used to skip that entirely (Escape doesn't
  // blur the focused element on its own), silently discarding whatever the
  // admin had just typed. The X button already blurs naturally (clicking a
  // button moves focus there first), but calling it explicitly here too
  // means both paths are equally safe regardless of browser quirks.
  function closeAndBlur() {
    (document.activeElement as HTMLElement | null)?.blur();
    onClose();
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeAndBlur();
      // The arrow buttons are plain flex siblings with no explicit
      // `direction`, so they inherit the page's dir="rtl" — the DOM's
      // first child (prev) ends up rendered on the visual right, the last
      // (next) on the visual left. Keyboard arrows follow the same visual
      // mapping, not a fixed "← is always previous" rule.
      if (e.key === "ArrowRight" && onPrev) onPrev();
      if (e.key === "ArrowLeft" && onNext) onNext();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose, onPrev, onNext]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: 24,
        boxSizing: "border-box",
      }}
    >
      {/* Arrows sit as flex siblings right up against the card itself
          (not pinned to the far screen edges) — on a wide viewport the
          card tops out at 1040px, so edge-pinned arrows would end up far
          from what they're actually paging. flex-shrink:0 keeps them from
          being squeezed by the card's own min(1040px, 94vw) width. */}
      {/* RTL flex row renders this first child on the visual right —
          glyph points outward (right) to match. */}
      {onPrev && (
        <button type="button" onClick={onPrev} aria-label="הקודם" style={arrowButtonStyle}>
          ›
        </button>
      )}
      <div
        style={{
          width: "min(1040px, 94vw)",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "white",
          borderRadius: 16,
          boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "12px 16px", borderBottom: "1px solid #eee" }}>
          <button
            type="button"
            onClick={closeAndBlur}
            aria-label="סגירה"
            style={{ fontSize: 18, width: 32, height: 32, padding: 0, border: "1px solid #ddd", borderRadius: 6, background: "white", cursor: "pointer" }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
      {/* Last child renders on the visual left in RTL — glyph points
          outward (left) to match. */}
      {onNext && (
        <button type="button" onClick={onNext} aria-label="הבא" style={arrowButtonStyle}>
          ‹
        </button>
      )}
    </div>
  );
}

const arrowButtonStyle: React.CSSProperties = {
  flexShrink: 0,
  width: 44,
  height: 44,
  borderRadius: "50%",
  border: "none",
  background: "rgba(0,0,0,0.45)",
  color: "white",
  fontSize: 26,
  lineHeight: 1,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
