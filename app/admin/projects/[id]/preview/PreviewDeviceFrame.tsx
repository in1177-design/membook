"use client";

import { cloneElement, isValidElement, useState, type ReactElement } from "react";
import { colors } from "../../formStyles";
import type { Lang } from "../../../../i/[token]/types";

export default function PreviewDeviceFrame({
  children,
  initialLanguage,
}: {
  // The wrapped element (always <SubmissionWizard previewMode ... />) gets a
  // `lang` prop injected below so the language toggle here can drive it —
  // see the controlledLang sync effect in SubmissionWizard.tsx.
  children: ReactElement<{ lang?: Lang }>;
  initialLanguage: Lang;
}) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [lang, setLang] = useState<Lang>(initialLanguage);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{ display: "inline-flex", padding: 3, borderRadius: 999, background: "#f1efe9", border: `1px solid ${colors.border}` }}>
          <button type="button" onClick={() => setDevice("desktop")} style={segmentStyle(device === "desktop")} aria-label="תצוגת דסקטופ">
            <DesktopIcon />
          </button>
          <button type="button" onClick={() => setDevice("mobile")} style={segmentStyle(device === "mobile")} aria-label="תצוגת מובייל">
            <MobileIcon />
          </button>
        </div>

        <div style={{ display: "inline-flex", padding: 3, borderRadius: 999, background: "#f1efe9", border: `1px solid ${colors.border}` }}>
          {(["HE", "RU", "EN"] as Lang[]).map((l) => (
            <button key={l} type="button" onClick={() => setLang(l)} style={segmentStyle(lang === l)} aria-label={`שפה: ${l}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div style={device === "mobile" ? { maxWidth: 420, margin: "0 auto" } : undefined}>
        {isValidElement(children) ? cloneElement(children, { lang }) : children}
      </div>
    </div>
  );
}

function segmentStyle(active: boolean): React.CSSProperties {
  return {
    padding: "6px 14px",
    fontSize: 12,
    fontWeight: 700,
    borderRadius: 999,
    border: "none",
    background: active ? colors.buttonDark : "transparent",
    color: active ? "white" : colors.textLabel,
    cursor: "pointer",
  };
}

function DesktopIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="3.5" width="16" height="10.5" rx="1.3" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7 17h6M10 14v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function MobileIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <rect x="5.5" y="2" width="9" height="16" rx="1.6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9 15.3h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
