"use client";

import { useEffect } from "react";

export default function Drawer({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 50 }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: "min(560px, 100%)",
          background: "white",
          boxShadow: "4px 0 20px rgba(0,0,0,0.12)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "12px 16px", borderBottom: "1px solid #eee" }}>
          <button
            type="button"
            onClick={onClose}
            aria-label="סגירה"
            style={{ fontSize: 18, width: 32, height: 32, padding: 0, border: "1px solid #ddd", borderRadius: 6, background: "white", cursor: "pointer" }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}
