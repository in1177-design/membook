"use client";

import { useState } from "react";
import { colors, sectionHeaderStyle, inputStyle, ltrInputStyle, checkboxInputStyle, checkboxLabelStyle } from "./formStyles";

type IntroTemplate = { id: string; label: string; textHe: string };

type Props = {
  templates: IntroTemplate[];
  initialText?: string;
  initialTextRu?: string;
  initialTextEn?: string;
  showRu: boolean;
  showEn: boolean;
  readOnly?: boolean;
};

export default function IntroTextBuilder({ templates, initialText, initialTextRu, initialTextEn, showRu, showEn, readOnly }: Props) {
  const [text, setText] = useState(initialText ?? "");
  const [textRu, setTextRu] = useState(initialTextRu ?? "");
  const [textEn, setTextEn] = useState(initialTextEn ?? "");

  const columnCount = 1 + (showRu ? 1 : 0) + (showEn ? 1 : 0);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 12 }}>
        <h3 style={sectionHeaderStyle}>טקסט פתיחה למוזמנים</h3>
        {!readOnly && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            {templates.length > 0 && (
              <select
                style={{ ...inputStyle, width: "auto", fontSize: 13, padding: "6px 10px" }}
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
            <label style={checkboxLabelStyle}>
              שמירת הטקסט הזה כתבנית חדשה לפרויקטים הבאים
              <input type="checkbox" name="saveIntroAsTemplate" defaultChecked style={checkboxInputStyle} />
            </label>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: `repeat(${columnCount}, 1fr)`, gap: 16 }}>
        <label style={{ display: "block" }}>
          <span style={{ display: "block", fontSize: 12, fontWeight: 700, color: colors.sectionHeader, marginBottom: 6 }}>עברית</span>
          <textarea
            name="introTextHe"
            rows={4}
            value={text}
            disabled={readOnly}
            onChange={(e) => setText(e.target.value)}
            placeholder="למשל: משפחת [שם המשפחה] בחרה להעניק ל[שם החוגג/ת] מתנה מיוחדת — ספר ברכות וזיכרונות..."
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </label>

        <label style={{ display: showRu ? "block" : "none" }}>
          <span style={{ display: "block", fontSize: 12, fontWeight: 700, color: colors.sectionHeader, marginBottom: 6 }}>רוסית</span>
          <textarea
            name="introTextRu"
            rows={4}
            value={textRu}
            disabled={readOnly}
            onChange={(e) => setTextRu(e.target.value)}
            placeholder="תרגום לרוסית"
            style={{ ...ltrInputStyle, resize: "vertical" }}
          />
        </label>
        <label style={{ display: showEn ? "block" : "none" }}>
          <span style={{ display: "block", fontSize: 12, fontWeight: 700, color: colors.sectionHeader, marginBottom: 6 }}>אנגלית</span>
          <textarea
            name="introTextEn"
            rows={4}
            value={textEn}
            disabled={readOnly}
            onChange={(e) => setTextEn(e.target.value)}
            placeholder="תרגום לאנגלית"
            style={{ ...ltrInputStyle, resize: "vertical" }}
          />
        </label>
      </div>
    </div>
  );
}
