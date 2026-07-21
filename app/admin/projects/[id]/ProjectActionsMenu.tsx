"use client";

import { useEffect, useRef, useState } from "react";
import { setProjectStatus } from "../../../../lib/actions";

type Props = {
  projectId: string;
  status: "ACTIVE" | "CLOSED";
  totalPhotos: number;
};

export default function ProjectActionsMenu({ projectId, status, totalPhotos }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="פעולות נוספות"
        title="פעולות נוספות"
        style={{
          width: 30,
          height: 30,
          padding: 0,
          border: "1px solid #e0ddd7",
          borderRadius: 8,
          background: "white",
          cursor: "pointer",
          fontSize: 16,
          color: "#555",
        }}
      >
        ⋯
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            insetInlineStart: 0,
            minWidth: 200,
            background: "white",
            border: "1px solid #eee",
            borderRadius: 10,
            boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
            padding: 6,
            zIndex: 10,
          }}
        >
          {totalPhotos > 0 && (
            <a
              href={`/api/admin/projects/${projectId}/zip`}
              style={menuItemStyle}
              onClick={() => setOpen(false)}
            >
              הורדת כל התמונות ({totalPhotos}) כ-ZIP
            </a>
          )}
          <form
            action={async () => {
              setOpen(false);
              await setProjectStatus(projectId, status === "ACTIVE" ? "CLOSED" : "ACTIVE");
            }}
          >
            <button type="submit" style={{ ...menuItemStyle, width: "100%", textAlign: "start", border: "none", background: "none", cursor: "pointer", font: "inherit" }}>
              {status === "ACTIVE" ? "סגירת פרויקט" : "פתיחת פרויקט מחדש"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

const menuItemStyle: React.CSSProperties = {
  display: "block",
  padding: "9px 10px",
  borderRadius: 6,
  fontSize: 13,
  color: "#222",
  textDecoration: "none",
};
