"use client";

import { useState } from "react";

type IntroTemplate = { id: string; label: string; textHe: string };

type Props = {
  templates: IntroTemplate[];
  initialText?: string;
  initialTextRu?: string;
  initialTextEn?: string;
};

export default function IntroTextBuilder({ templates, initialText, initialTextRu, initialTextEn }: Props) {
  const [text, setText] = useState(initialText ?? "");
  const [textRu, setTextRu] = useState(initialTextRu ?? "");
  const [textEn, setTextEn] = useState(initialTextEn ?? "");
  const [showRu, setShowRu] = useState(Boolean(initialTextRu));
  const [showEn, setShowEn] = useState(Boolean(initialTextEn));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4, flexWrap: "wrap", gap: 8 }}>
        <p style={labelStyle}>טקסט פתיחה למוזמנים</p>
        <div style={{ display: "flex", gap: 6 }}>
          {templates.length > 0 && (
            <select
              style={{ fontSize: 12, width: "auto", padding: "4px 8px" }}
              defaultValue=""
              onChange={(e) => {
                const template = templates.find((t) => t.id === e.target.value);
                if (template) setText(template.textHe);
              }}
            >
              <option value="">בחרי מתבנית שמורה...</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  תבנית: {t.label}
                </option>
              ))}
            </select>
          )}
          <button type="button" onClick={() => setShowRu((v) => !v)} style={langButtonStyle}>
            RU
          </button>
          <button type="button" onClick={() => setShowEn((v) => !v)} style={langButtonStyle}>
            ENG
          </button>
        </div>
      </div>
      <p style={{ fontSize: 12, color: "#888", margin: "0 0 12px" }}>
        בחירה מתבנית שמורה ממלאת את הטקסט, ואז אפשר לערוך אותו לפי הפרויקט
      </p>
      <textarea
        name="introTextHe"
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="למשל: משפחת [שם המשפחה] בחרה להעניק ל[שם החוגג/ת] מתנה מיוחדת — ספר ברכות וזיכרונות..."
        style={{ width: "100%", marginBottom: 8, padding: "8px 10px", fontSize: 14, border: "1px solid #ccc", borderRadius: 6, resize: "vertical" }}
      />

      {showRu && (
        <label style={{ display: "block" }}>
          <span style={labelStyle}>רוסית</span>
          <textarea
            name="introTextRu"
            rows={4}
            value={textRu}
            onChange={(e) => setTextRu(e.target.value)}
            placeholder="תרגום לרוסית"
            style={{ width: "100%", marginBottom: 8, padding: "8px 10px", fontSize: 14, border: "1px solid #ccc", borderRadius: 6, resize: "vertical" }}
          />
        </label>
      )}
      {showEn && (
        <label style={{ display: "block" }}>
          <span style={labelStyle}>אנגלית</span>
          <textarea
            name="introTextEn"
            rows={4}
            value={textEn}
            onChange={(e) => setTextEn(e.target.value)}
            placeholder="תרגום לאנגלית"
            style={{ width: "100%", marginBottom: 8, padding: "8px 10px", fontSize: 14, border: "1px solid #ccc", borderRadius: 6, resize: "vertical" }}
          />
        </label>
      )}

      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#666" }}>
        <input type="checkbox" name="saveIntroAsTemplate" defaultChecked style={{ width: "auto" }} />
        שמירת הטקסט הזה כתבנית חדשה לפרויקטים הבאים
      </label>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "#333",
  margin: "0 0 4px",
};

const langButtonStyle: React.CSSProperties = {
  fontSize: 12,
  padding: "4px 10px",
  border: "1px solid #ccc",
  borderRadius: 6,
  background: "white",
  cursor: "pointer",
  width: "auto",
};
