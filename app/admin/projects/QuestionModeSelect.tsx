"use client";

import { labelStyle, checkboxLabelStyle, colors } from "./formStyles";

type Props = {
  value: "ALL" | "PICK_ONE";
  onChange: (value: "ALL" | "PICK_ONE") => void;
  readOnly?: boolean;
};

export default function QuestionModeSelect({ value, onChange, readOnly }: Props) {
  return (
    <div>
      <span style={labelStyle}>שאלות למוזמנים</span>
      <div style={{ display: "grid", gap: 8, justifyItems: "start" }}>
        <label style={checkboxLabelStyle}>
          <input
            type="radio"
            name="questionMode"
            value="ALL"
            checked={value === "ALL"}
            disabled={readOnly}
            onChange={() => onChange("ALL")}
            style={{ width: 18, height: 18, accentColor: colors.accent, cursor: readOnly ? "default" : "pointer" }}
          />
          כולם עונים על כל השאלות
        </label>
        <label style={checkboxLabelStyle}>
          <input
            type="radio"
            name="questionMode"
            value="PICK_ONE"
            checked={value === "PICK_ONE"}
            disabled={readOnly}
            onChange={() => onChange("PICK_ONE")}
            style={{ width: 18, height: 18, accentColor: colors.accent, cursor: readOnly ? "default" : "pointer" }}
          />
          כל אחד/ת בוחר/ת שאלה אחת לענות עליה
        </label>
      </div>
    </div>
  );
}
