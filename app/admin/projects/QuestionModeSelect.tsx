"use client";

import { labelStyle, colors } from "./formStyles";

type Props = {
  value: "ALL" | "PICK_ONE";
  onChange: (value: "ALL" | "PICK_ONE") => void;
  readOnly?: boolean;
};

export default function QuestionModeSelect({ value, onChange, readOnly }: Props) {
  return (
    <div>
      <span style={labelStyle}>שאלות למוזמנים</span>
      <input type="hidden" name="questionMode" value={value} />
      <div
        style={{
          display: "inline-flex",
          padding: 3,
          borderRadius: 999,
          background: colors.inputBg,
          border: `1px solid ${colors.border}`,
        }}
      >
        <button
          type="button"
          disabled={readOnly}
          onClick={() => onChange("ALL")}
          style={segmentStyle(value === "ALL", readOnly)}
        >
          כולם עונים על כל השאלות
        </button>
        <button
          type="button"
          disabled={readOnly}
          onClick={() => onChange("PICK_ONE")}
          style={segmentStyle(value === "PICK_ONE", readOnly)}
        >
          כל אחד/ת בוחר/ת שאלה אחת לענות עליה
        </button>
      </div>
    </div>
  );
}

function segmentStyle(active: boolean, readOnly?: boolean): React.CSSProperties {
  return {
    padding: "8px 14px",
    fontSize: 13,
    fontWeight: 700,
    borderRadius: 999,
    border: "none",
    background: active ? colors.buttonDark : "transparent",
    color: active ? "white" : colors.textSecondary,
    cursor: readOnly ? "default" : "pointer",
  };
}
