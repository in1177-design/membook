"use client";

import { useState } from "react";
import {
  DesignSystemStyles,
  dsColors,
  dsFocusRing,
  dsTokens,
  MobileButtonStack,
  PrimaryButton,
  ProgressPills,
  SecondaryButton,
  Toggle,
} from "../../../components/design-system";

const sectionStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  padding: 24,
  marginBottom: 20,
};

const codeStyle: React.CSSProperties = {
  display: "block",
  background: "#f7f6f4",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  padding: 14,
  fontSize: 13,
  direction: "ltr",
  textAlign: "left",
  overflowX: "auto",
  marginTop: 14,
  whiteSpace: "pre",
};

// Reads the actual live values off dsTokens (never hand-typed here) — so
// this table can never drift out of sync with what the components render.
// Change a value in tokens.ts and both the component above AND this row
// update together.
function TokenTable({ token }: { token: Record<string, string | number> }) {
  const entries = Object.entries(token).filter(([key]) => key !== "name");
  return (
    <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: "6px 20px", fontSize: 12, color: "#555" }}>
      {entries.map(([key, value]) => (
        <span key={key} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <b>{key}:</b>
          {typeof value === "string" && value.startsWith("#") && (
            <span
              style={{
                display: "inline-block",
                width: 12,
                height: 12,
                borderRadius: 3,
                background: value,
                border: "1px solid #ddd",
              }}
            />
          )}
          {String(value)}
        </span>
      ))}
    </div>
  );
}

const COLOR_LABELS: Record<keyof typeof dsColors, string> = {
  primary: "ראשי (מערכת)",
  adminGray: "אפור אדמין (כמו תפריט ראשי)",
  adminOrange: "כתום אדמין",
};

function ColorSwatch({ colorKey }: { colorKey: keyof typeof dsColors }) {
  const value = dsColors[colorKey];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ display: "inline-block", width: 36, height: 36, borderRadius: 8, background: value, border: "1px solid #ddd", flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: 13, fontWeight: 700 }}>{COLOR_LABELS[colorKey]}</div>
        <code style={{ fontSize: 12, color: "#666" }}>
          dsColors.{colorKey} — {value}
        </code>
      </div>
    </div>
  );
}

export default function StyleGuidePage() {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [lang, setLang] = useState<"HE" | "RU" | "EN">("HE");
  const [progressStep, setProgressStep] = useState(3);

  return (
    <main style={{ maxWidth: 820, margin: "40px auto", padding: 24 }}>
      <DesignSystemStyles />

      <h1 style={{ fontSize: 24, marginBottom: 4 }}>מערכת עיצוב</h1>
      <p style={{ color: "#666", marginBottom: 12, fontSize: 14 }}>
        מקום אחד לכל הקומפוננטות המשותפות (טוגל, כפתור ראשי, כפתור משני) — מקור אמת יחיד לצבעים
        ולמידות שלהן. הקוד: <code>components/design-system/</code>. שינוי כאן משנה רק את המראה של
        הקומפוננטות האלה עצמן — הוא לא מוחל אוטומטית על שום מקום אחר באתר עד שמעדכנים אותו להשתמש
        בהן.
      </p>
      <p style={{ color: "#666", marginBottom: 28, fontSize: 14 }}>
        לכל הכפתורים ולטוגל יש עכשיו גם מצב <b>הובר</b> (עכבר מעל) ומצב <b>פוקוס</b> (ניווט
        מקלדת/Tab) — נסי לרחף עם העכבר מעל הדוגמאות למטה, או לעבור ביניהן עם מקש Tab. טבעת הפוקוס
        זהה בכל מקום: מסגרת בעובי {dsFocusRing.width}px בצבע <code>{dsFocusRing.color}</code>.
      </p>

      <section style={sectionStyle}>
        <h2 style={{ fontSize: 16, marginBottom: 4 }}>צבעים (Colors)</h2>
        <p style={{ color: "#666", fontSize: 13, marginBottom: 16 }}>
          הצבע הראשי של המערכת, ושני צבעי האדמין (אפור כמו התפריט הראשי, וכתום) — כולם ב-
          <code>dsColors</code>. הכפתור הראשי, הכפתור המשני וטבעת הפוקוס מצביעים כולם על{" "}
          <code>dsColors.primary</code> ולא על ערך משלהם, כך ששינוי כאן משנה את כולם יחד.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <ColorSwatch colorKey="primary" />
          <ColorSwatch colorKey="adminGray" />
          <ColorSwatch colorKey="adminOrange" />
        </div>

        <code style={codeStyle}>{`import { dsColors } from "@/components/design-system";

dsColors.primary      // "${dsColors.primary}"
dsColors.adminGray    // "${dsColors.adminGray}"
dsColors.adminOrange  // "${dsColors.adminOrange}"`}</code>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ fontSize: 16, marginBottom: 4 }}>טוגל (Toggle)</h2>
        <p style={{ color: "#666", fontSize: 13, marginBottom: 16 }}>
          מתג מקוטע (כמו דסקטופ/מובייל בתצוגה המקדימה, או שפה HE/RU/EN).
        </p>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Toggle
            value={device}
            onChange={setDevice}
            options={[
              { value: "desktop", label: "דסקטופ" },
              { value: "mobile", label: "מובייל" },
            ]}
          />
          <Toggle
            value={lang}
            onChange={setLang}
            options={[
              { value: "HE", label: "HE" },
              { value: "RU", label: "RU" },
              { value: "EN", label: "EN" },
            ]}
          />
        </div>

        <TokenTable token={dsTokens.toggle} />

        <code style={codeStyle}>{`import { Toggle } from "@/components/design-system";

const [value, setValue] = useState("desktop");

<Toggle
  value={value}
  onChange={setValue}
  options={[
    { value: "desktop", label: "דסקטופ" },
    { value: "mobile", label: "מובייל" },
  ]}
/>`}</code>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ fontSize: 16, marginBottom: 4 }}>פס התקדמות (Progress Pills)</h2>
        <p style={{ color: "#666", fontSize: 13, marginBottom: 16 }}>
          פס השלבים המקוטע שמופיע בראש כל שלב בוויזארד המוזמן — אותה קומפוננטה בדיוק (StepProgress
          ב-SubmissionBook.tsx). לחצי על הכפתורים כדי לראות אותו זז.
        </p>

        <ProgressPills current={progressStep} total={5} />
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <SecondaryButton onClick={() => setProgressStep((s) => Math.max(0, s - 1))}>הקודם</SecondaryButton>
          <SecondaryButton onClick={() => setProgressStep((s) => Math.min(5, s + 1))}>הבא</SecondaryButton>
        </div>

        <TokenTable token={dsTokens.progressPill} />

        <code style={codeStyle}>{`import { ProgressPills } from "@/components/design-system";

<ProgressPills current={3} total={5} />`}</code>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ fontSize: 16, marginBottom: 4 }}>כפתור ראשי (Primary)</h2>
        <p style={{ color: "#666", fontSize: 13, marginBottom: 16 }}>
          פעולה ראשית (למשל "המשך", "שליחה", "בואי נתחיל").
        </p>

        <PrimaryButton>המשך לשלב הבא</PrimaryButton>

        <TokenTable token={dsTokens.primaryButton} />

        <code style={codeStyle}>{`import { PrimaryButton } from "@/components/design-system";

<PrimaryButton onClick={onNext}>המשך לשלב הבא</PrimaryButton>`}</code>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ fontSize: 16, marginBottom: 4 }}>כפתור משני (Secondary)</h2>
        <p style={{ color: "#666", fontSize: 13, marginBottom: 16 }}>
          פעולה משנית לצד כפתור ראשי (למשל "חזרה לשלב הקודם", "חזרה לעריכה").
        </p>

        <SecondaryButton>חזרה לשלב הקודם</SecondaryButton>

        <TokenTable token={dsTokens.secondaryButton} />

        <code style={codeStyle}>{`import { SecondaryButton } from "@/components/design-system";

<SecondaryButton onClick={onBack}>חזרה לשלב הקודם</SecondaryButton>`}</code>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ fontSize: 16, marginBottom: 4 }}>ראשי + משני יחד (דסקטופ)</h2>
        <div style={{ display: "flex", gap: 10 }}>
          <PrimaryButton>שליחה</PrimaryButton>
          <SecondaryButton>חזרה לעריכה</SecondaryButton>
        </div>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ fontSize: 16, marginBottom: 4 }}>2 כפתורים – מובייל (אחד מתחת לשני)</h2>
        <p style={{ color: "#666", fontSize: 13, marginBottom: 16 }}>
          התבנית שחוזרת בתחתית כל שלב בוויזארד המוזמן במובייל: כפתור ראשי ברוחב מלא למעלה, כפתור
          משני ברוחב מלא מתחתיו.
        </p>

        <div style={{ maxWidth: 320, border: "1px dashed #d8d6d1", borderRadius: 10, padding: 16 }}>
          <MobileButtonStack primaryLabel="שליחה" secondaryLabel="חזרה לעריכה" />
        </div>

        <code style={codeStyle}>{`import { MobileButtonStack } from "@/components/design-system";

<MobileButtonStack
  primaryLabel="שליחה"
  onPrimaryClick={onSend}
  secondaryLabel="חזרה לעריכה"
  onSecondaryClick={onBack}
/>`}</code>
      </section>
    </main>
  );
}
