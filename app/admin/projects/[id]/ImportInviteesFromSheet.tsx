"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { previewGoogleSheetInvitees, bulkAddInvitees } from "../../../../lib/actions";
import { normalizeIsraeliPhone } from "../../../../lib/googleSheet";

type LanguageCode = "HE" | "RU" | "EN";
type Row = { name: string; name2: string; phone: string; language: LanguageCode; include: boolean };

const LANGUAGE_OPTIONS: { value: LanguageCode; label: string }[] = [
  { value: "HE", label: "עב" },
  { value: "RU", label: "רו" },
  { value: "EN", label: "en" },
];

export default function ImportInviteesFromSheet({
  projectId,
  defaultLanguage,
  enabledLanguages,
  onImported,
}: {
  projectId: string;
  defaultLanguage: string;
  // Same album-language gating as AddInviteeForm/EditInviteeForm in
  // InviteesTable.tsx — only these languages are offered per row.
  enabledLanguages: string[];
  onImported: () => void;
}) {
  const router = useRouter();
  const [sheetUrl, setSheetUrl] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [skippedDuplicates, setSkippedDuplicates] = useState(0);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const languageOptions = LANGUAGE_OPTIONS.filter((opt) => enabledLanguages.includes(opt.value));
  const fallbackLanguage: LanguageCode = languageOptions[0]?.value ?? "HE";
  const projectDefaultLanguage: LanguageCode =
    defaultLanguage === "RU" || defaultLanguage === "EN" ? defaultLanguage : "HE";
  const initialRowLanguage: LanguageCode = enabledLanguages.includes(projectDefaultLanguage) ? projectDefaultLanguage : fallbackLanguage;

  async function handleLoad(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { rows: found, skippedDuplicates: skipped } = await previewGoogleSheetInvitees(sheetUrl, projectId);
      setSkippedDuplicates(skipped);
      if (found.length === 0) {
        setError(skipped > 0 ? "כל השורות בגיליון כבר קיימות ברשימת המוזמנים" : "לא נמצאו שורות עם שם בגיליון");
      } else {
        setRows(found.map((r) => ({ ...r, name2: "", language: initialRowLanguage, include: true })));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "משהו השתבש, נסי שוב");
    } finally {
      setLoading(false);
    }
  }

  async function handleImport() {
    if (!rows) return;
    setImporting(true);
    setError(null);
    try {
      const selected = rows.filter((r) => r.include).map(({ name, phone, name2, language }) => ({ name, phone, name2, language }));
      await bulkAddInvitees(projectId, selected);
      router.refresh();
      onImported();
    } catch {
      setError("הייבוא נכשל, נסי שוב");
      setImporting(false);
    }
  }

  function updateRow(i: number, patch: Partial<Row>) {
    setRows((prev) => prev && prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  const includedCount = rows?.filter((r) => r.include).length ?? 0;

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div>
        <h2 style={{ fontSize: 18, margin: 0 }}>ייבוא רשימה מגוגל שיטס</h2>
        <p style={{ fontSize: 13, color: "#999", margin: "4px 0 0" }}>
          הדביקי קישור לגיליון (משותף לצפייה לכל מי שיש לו את הקישור) ובו שתי עמודות — שם וטלפון.
        </p>
      </div>

      {!rows && (
        <form onSubmit={handleLoad} style={{ display: "grid", gap: 10 }}>
          <input
            type="url"
            required
            value={sheetUrl}
            onChange={(e) => setSheetUrl(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/..."
            style={inputStyle}
          />
          {languageOptions.length === 0 && (
            <p style={{ color: "#b00020", fontSize: 14, margin: 0 }}>לא הוגדרו שפות לפרויקט זה — אי אפשר לייבא מוזמנים. עדכני את שפות הפרויקט בהגדרות.</p>
          )}
          {error && <p style={{ color: "#b00020", fontSize: 14, margin: 0 }}>{error}</p>}
          <button type="submit" disabled={loading || languageOptions.length === 0} style={buttonStyle}>
            {loading ? "טוענת..." : "טעינת הגיליון"}
          </button>
        </form>
      )}

      {rows && (
        <>
          {skippedDuplicates > 0 && (
            <p style={{ fontSize: 13, color: "#a15c00", background: "#fef6e0", borderRadius: 8, padding: "8px 12px", margin: 0 }}>
              {skippedDuplicates} מספרי טלפון מהגיליון כבר קיימים ברשימת המוזמנים ולא הוצגו.
            </p>
          )}

          <div style={{ maxHeight: 360, overflowY: "auto", border: "1px solid #eee", borderRadius: 10 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={previewThStyle}></th>
                  <th style={previewThStyle}>שם</th>
                  <th style={previewThStyle}>שם שני (אופציונלי)</th>
                  <th style={previewThStyle}>טלפון</th>
                  <th style={previewThStyle}>שפה</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} style={{ borderTop: "1px solid #f2f2f2", opacity: r.include ? 1 : 0.4 }}>
                    <td style={previewTdStyle}>
                      <input type="checkbox" checked={r.include} onChange={(e) => updateRow(i, { include: e.target.checked })} />
                    </td>
                    <td style={previewTdStyle}>
                      <input value={r.name} onChange={(e) => updateRow(i, { name: e.target.value })} style={cellInputStyle} />
                    </td>
                    <td style={previewTdStyle}>
                      <input
                        value={r.name2}
                        onChange={(e) => updateRow(i, { name2: e.target.value })}
                        placeholder="לזוגות, מילוי ידני"
                        style={cellInputStyle}
                      />
                    </td>
                    <td style={previewTdStyle}>
                      <input
                        value={r.phone}
                        onChange={(e) => updateRow(i, { phone: e.target.value })}
                        onBlur={(e) => updateRow(i, { phone: normalizeIsraeliPhone(e.target.value) })}
                        style={cellInputStyle}
                      />
                    </td>
                    <td style={previewTdStyle}>
                      <div style={{ display: "flex", gap: 3 }}>
                        {languageOptions.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => updateRow(i, { language: opt.value })}
                            title={opt.value}
                            style={{
                              ...languageBtnStyle,
                              background: r.language === opt.value ? "#1f1f1f" : "white",
                              color: r.language === opt.value ? "white" : "#666",
                            }}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {error && <p style={{ color: "#b00020", fontSize: 14, margin: 0 }}>{error}</p>}

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => {
                setRows(null);
                setSheetUrl("");
              }}
              style={secondaryButtonStyle}
            >
              קישור אחר
            </button>
            <button type="button" onClick={handleImport} disabled={importing || includedCount === 0} style={buttonStyle}>
              {importing ? "מייבאת..." : `ייבוא ${includedCount} מוזמנים`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "8px 10px",
  fontSize: 15,
  border: "1px solid #ccc",
  borderRadius: 6,
  width: "100%",
  boxSizing: "border-box",
};

const cellInputStyle: React.CSSProperties = {
  padding: "5px 7px",
  fontSize: 13,
  border: "1px solid #e0ddd7",
  borderRadius: 5,
  width: "100%",
  boxSizing: "border-box",
};

const buttonStyle: React.CSSProperties = {
  padding: "10px 14px",
  fontSize: 15,
  background: "#1f1f1f",
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  width: "fit-content",
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "10px 14px",
  fontSize: 15,
  background: "white",
  color: "#333",
  border: "1px solid #ccc",
  borderRadius: 6,
  cursor: "pointer",
  width: "fit-content",
};

const previewThStyle: React.CSSProperties = {
  textAlign: "right",
  padding: "8px 8px",
  color: "#999",
  fontSize: 11,
  fontWeight: 500,
  position: "sticky",
  top: 0,
  background: "white",
};

const previewTdStyle: React.CSSProperties = { padding: "5px 8px" };

const languageBtnStyle: React.CSSProperties = {
  width: 26,
  height: 22,
  padding: 0,
  fontSize: 11,
  fontWeight: 600,
  border: "1px solid #e0ddd7",
  borderRadius: 5,
  cursor: "pointer",
};
