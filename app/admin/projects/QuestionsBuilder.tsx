"use client";

import { useState } from "react";

type QuestionTemplate = { id: string; textHe: string; helperTextHe: string | null };
type ExistingQuestion = {
  id: string;
  textHe: string;
  textRu?: string | null;
  textEn?: string | null;
  helperTextHe: string | null;
};

type Row = {
  id: number;
  questionId: string;
  text: string;
  helper: string;
  textRu: string;
  textEn: string;
};

let nextId = 0;

export default function QuestionsBuilder({
  templates,
  existingQuestions,
}: {
  templates: QuestionTemplate[];
  existingQuestions?: ExistingQuestion[];
}) {
  const [rows, setRows] = useState<Row[]>(
    existingQuestions && existingQuestions.length > 0
      ? existingQuestions.map((q) => ({
          id: nextId++,
          questionId: q.id,
          text: q.textHe,
          helper: q.helperTextHe ?? "",
          textRu: q.textRu ?? "",
          textEn: q.textEn ?? "",
        }))
      : [{ id: nextId++, questionId: "", text: "", helper: "", textRu: "", textEn: "" }]
  );
  const [showRu, setShowRu] = useState(Boolean(existingQuestions?.some((q) => q.textRu)));
  const [showEn, setShowEn] = useState(Boolean(existingQuestions?.some((q) => q.textEn)));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  function addRow(text: string, helper: string) {
    setRows((prev) => [...prev, { id: nextId++, questionId: "", text, helper, textRu: "", textEn: "" }]);
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4, flexWrap: "wrap", gap: 8 }}>
        <p style={{ fontWeight: 500, fontSize: 15, margin: 0 }}>שאלות למוזמנים</p>
        <div style={{ display: "flex", gap: 6 }}>
          {templates.length > 0 && (
            <button type="button" onClick={() => setDrawerOpen(true)} style={{ fontSize: 13, padding: "6px 12px", width: "auto" }}>
              שאלות שמורות
            </button>
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
        כתבי שאלה חדשה, או בחרי משאלות שנוצרו בפרויקטים קודמים
      </p>

      <div style={{ display: "grid", gap: 14, marginBottom: 10 }}>
        {rows.map((row) => (
          <div key={row.id} style={{ border: "1px solid #ddd", borderRadius: 6, padding: 10, display: "grid", gap: 8 }}>
            <input type="hidden" name="questionId" value={row.questionId} />
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              <label style={{ flex: 1, display: "block" }}>
                <span style={fieldLabelStyle}>נוסח השאלה</span>
                <input
                  name="questionText"
                  value={row.text}
                  onChange={(e) => updateRow(row.id, "text", e.target.value)}
                  placeholder="נוסח השאלה"
                  style={{ width: "100%", padding: "8px 10px", fontSize: 14, border: "1px solid #ccc", borderRadius: 6 }}
                />
              </label>
              <button
                type="button"
                aria-label="הסרת שאלה"
                onClick={() => removeRow(row.id)}
                style={{ width: 36, padding: 0 }}
              >
                ✕
              </button>
            </div>

            {showRu && (
              <label style={{ display: "block" }}>
                <span style={fieldLabelStyle}>תרגום לרוסית</span>
                <input
                  name="questionTextRu"
                  value={row.textRu}
                  onChange={(e) => updateRow(row.id, "textRu", e.target.value)}
                  placeholder="תרגום השאלה לרוסית"
                  style={{ width: "100%", padding: "8px 10px", fontSize: 14, border: "1px solid #ccc", borderRadius: 6 }}
                />
              </label>
            )}
            {showEn && (
              <label style={{ display: "block" }}>
                <span style={fieldLabelStyle}>תרגום לאנגלית</span>
                <input
                  name="questionTextEn"
                  value={row.textEn}
                  onChange={(e) => updateRow(row.id, "textEn", e.target.value)}
                  placeholder="תרגום השאלה לאנגלית"
                  style={{ width: "100%", padding: "8px 10px", fontSize: 14, border: "1px solid #ccc", borderRadius: 6 }}
                />
              </label>
            )}

            <label style={{ display: "block" }}>
              <span style={fieldLabelStyle}>טקסט מסביר (אופציונלי)</span>
              <input
                name="questionHelper"
                value={row.helper}
                onChange={(e) => updateRow(row.id, "helper", e.target.value)}
                placeholder="טקסט מסביר (אופציונלי)"
                style={{ width: "100%", fontSize: 13, padding: "6px 8px", border: "1px solid #ccc", borderRadius: 6 }}
              />
            </label>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => addRow("", "")}>
        + הוספת שאלה חדשה
      </button>

      {drawerOpen && (
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
              borderLeft: "1px solid #ddd",
              boxShadow: "-4px 0 16px rgba(0,0,0,0.08)",
              zIndex: 2,
              padding: 16,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <p style={{ fontWeight: 500, fontSize: 14, margin: 0 }}>שאלות שמורות</p>
              <button type="button" aria-label="סגירה" onClick={() => setDrawerOpen(false)} style={{ width: 30, padding: 0 }}>
                ✕
              </button>
            </div>
            <div style={{ display: "grid", gap: 6, overflowY: "auto", flex: 1 }}>
              {templates.map((t) => (
                <label
                  key={t.id}
                  style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, border: "1px solid #ddd", borderRadius: 6, padding: 8 }}
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
                    style={{ width: "auto" }}
                  />
                  {t.textHe}
                </label>
              ))}
            </div>
            <button
              type="button"
              onClick={addSelectedFromDrawer}
              style={{ marginTop: 12, background: "#1f1f1f", color: "white", border: "none", padding: "10px 14px", borderRadius: 6 }}
            >
              הוספת שאלות מסומנות
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const fieldLabelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  color: "#888",
  marginBottom: 2,
};

const langButtonStyle: React.CSSProperties = {
  fontSize: 12,
  padding: "0 10px",
  border: "1px solid #ccc",
  borderRadius: 6,
  background: "white",
  cursor: "pointer",
  width: "auto",
};
