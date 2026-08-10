"use client";

import { useEffect } from "react";

// Centered overlay — sibling to Drawer.tsx (same scrim/Escape/close-button
// conventions) but for content that needs to sit in the middle of the screen
// at a real width (e.g. AlbumPageView's book-page preview, which needs 860px+
// to trigger SubmissionBook's own desktop two-column layout) instead of an
// edge-docked side panel.
export default function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
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
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

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
        padding: 24,
        boxSizing: "border-box",
      }}
    >
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
    </div>
  );
}
