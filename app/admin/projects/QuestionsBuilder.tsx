"use client";

import { useState } from "react";
import { colors, sectionHeaderStyle, inputStyle, ltrInputStyle, secondaryButtonStyle, checkboxInputStyle } from "./formStyles";

type QuestionTemplate = { id: string; textHe: string; helperTextHe: string | null };
type ExistingQuestion = {
  id: string;
  textHe: string;
  textRu?: string | null;
  textEn?: string | null;
  helperTextHe: string | null;
  helperTextRu?: string | null;
  helperTextEn?: string | null;
};

type Row = {
  id: number;
  questionId: string;
  text: string;
  helper: string;
  helperRu: string;
  helperEn: string;
  textRu: string;
  textEn: string;
};

let nextId = 0;

export default function QuestionsBuilder({
  templates,
  existingQuestions,
  showRu,
  showEn,
  readOnly,
}: {
  templates: QuestionTemplate[];
  existingQuestions?: ExistingQuestion[];
  showRu: boolean;
  showEn: boolean;
  readOnly?: boolean;
}) {
  const [rows, setRows] = useState<Row[]>(
    existingQuestions && existingQuestions.length > 0
      ? existingQuestions.map((q) => ({
          id: nextId++,
          questionId: q.id,
          text: q.textHe,
          helper: q.helperTextHe ?? "",
          helperRu: q.helperTextRu ?? "",
          helperEn: q.helperTextEn ?? "",
          textRu: q.textRu ?? "",
          textEn: q.textEn ?? "",
        }))
      : [{ id: nextId++, questionId: "", text: "", helper: "", helperRu: "", helperEn: "", textRu: "", textEn: "" }]
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const columnCount = 1 + (showRu ? 1 : 0) + (showEn ? 1 : 0);

  function addRow(text: string, helper: string) {
    setRows((prev) => [...prev, { id: nextId++, questionId: "", text, helper, helperRu: "", helperEn: "", textRu: "", textEn: "" }]);
  }

  function removeRow(id: number) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function updateRow<K extends keyof Row>(id: number, field: K, value: Row[K]) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  function addSelectedFromDrawer() {
    for (const template of templates) {
      if (checked.has(template.id)) {
        addRow(template.textHe, template.helperTextHe ?? "");
      }
    }
    setChecked(new Set());
    setDrawerOpen(false);
  }

  return (
    <div style={{ position: "relative", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <h3 style={sectionHeaderStyle}>שאלות למוזמנים</h3>
        {!readOnly && templates.length > 0 && (
          <button type="button" onClick={() => setDrawerOpen(true)} style={secondaryButtonStyle}>
            שאלות שמורות
          </button>
        )}
      </div>

      <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
        {rows.length > 0 && (
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <span style={{ minWidth: 20 }} />
            <div style={{ flex: 1, display: "grid", gridTemplateColumns: `repeat(${columnCount}, 1fr)`, gap: 8 }}>
              <span style={fieldLabelStyle}>עברית</span>
              {showRu && <span style={fieldLabelStyle}>רוסית</span>}
              {showEn && <span style={fieldLabelStyle}>אנגלית</span>}
            </div>
            <span style={{ width: 36 }} />
          </div>
        )}
        {rows.map((row, index) => (
          <div key={row.id} style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: colors.textLabel, minWidth: 20, textAlign: "center" }}>
              {index + 1}
            </span>
            <input type="hidden" name="questionId" value={row.questionId} />
            <div style={{ flex: 1, display: "grid", gridTemplateColumns: `repeat(${columnCount}, 1fr)`, gap: 8 }}>
              <label style={{ display: "block" }}>
                <input
                  name="questionText"
                  value={row.text}
                  disabled={readOnly}
                  onChange={(e) => updateRow(row.id, "text", e.target.value)}
                  placeholder="נוסח השאלה"
                  style={inputStyle}
                />
              </label>
              <label style={{ display: showRu ? "block" : "none" }}>
                <input
                  name="questionTextRu"
                  value={row.textRu}
                  disabled={readOnly}
                  onChange={(e) => updateRow(row.id, "textRu", e.target.value)}
                  placeholder="תרגום השאלה לרוסית"
                  style={ltrInputStyle}
                />
              </label>
              <label style={{ display: showEn ? "block" : "none" }}>
                <input
                  name="questionTextEn"
                  value={row.textEn}
                  disabled={readOnly}
                  onChange={(e) => updateRow(row.id, "textEn", e.target.value)}
                  placeholder="תרגום השאלה לאנגלית"
                  style={ltrInputStyle}
                />
              </label>
            </div>
            {readOnly ? (
              <span style={{ width: 36 }} />
            ) : (
              <button type="button" aria-label="הסרת שאלה" onClick={() => removeRow(row.id)} style={trashButtonStyle}>
                <TrashIcon />
              </button>
            )}
          </div>
        ))}
      </div>
      {!readOnly && (
        <button type="button" onClick={() => addRow("", "")} style={addButtonStyle}>
          + הוספת שאלה חדשה
        </button>
      )}

      {!readOnly && drawerOpen && (
        <>
          <div
            onClick={() => setDrawerOpen(false)}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 1 }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              width: "78%",
              maxWidth: 320,
              background: "white",
              borderLeft: `1px solid ${colors.border}`,
              boxShadow: "-4px 0 16px rgba(0,0,0,0.08)",
              zIndex: 2,
              padding: 16,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <p style={{ fontWeight: 700, fontSize: 14, margin: 0, color: colors.textPrimary }}>שאלות שמורות</p>
              <button type="button" aria-label="סגירה" onClick={() => setDrawerOpen(false)} style={{ width: 30, padding: 0 }}>
                ✕
              </button>
            </div>
            <div style={{ display: "grid", gap: 6, overflowY: "auto", flex: 1 }}>
              {templates.map((t) => (
                <label
                  key={t.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 13,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 10,
                    padding: 8,
                    background: colors.inputBg,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked.has(t.id)}
                    onChange={(e) => {
                      setChecked((prev) => {
                        const next = new Set(prev);
                        if (e.target.checked) next.add(t.id);
                        else next.delete(t.id);
                        return next;
                      });
                    }}
                    style={checkboxInputStyle}
                  />
                  {t.textHe}
                </label>
              ))}
            </div>
            <button type="button" onClick={addSelectedFromDrawer} style={{ marginTop: 12, ...addButtonStyle, background: colors.buttonDark, color: "white", border: "none" }}>
              הוספת שאלות מסומנות
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path
        d="M4 6h12M8 6V4.5c0-.6.4-1 1-1h2c.6 0 1 .4 1 1V6m-7 0 .7 9.3c.05.7.6 1.2 1.3 1.2h5.6c.7 0 1.25-.5 1.3-1.2L15 6"
        stroke={colors.textSecondary}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const fieldLabelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  color: colors.textLabel,
  marginBottom: 4,
};

const trashButtonStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  flexShrink: 0,
  padding: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "white",
  border: `1px solid ${colors.border}`,
  borderRadius: 8,
  cursor: "pointer",
};

const addButtonStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 0",
  fontSize: 14,
  fontWeight: 700,
  color: colors.textSecondary,
  background: "white",
  border: `1px solid ${colors.border}`,
  borderRadius: 10,
  cursor: "pointer",
};
