"use client";

import { labelStyle, checkboxInputStyle, checkboxLabelStyle } from "./formStyles";

export default function LanguageCheckboxes({
  showRu,
  showEn,
  onChangeRu,
  onChangeEn,
  readOnly,
}: {
  showRu: boolean;
  showEn: boolean;
  onChangeRu: (value: boolean) => void;
  onChangeEn: (value: boolean) => void;
  readOnly?: boolean;
}) {
  return (
    <div>
      <span style={labelStyle}>שפות הפרויקט</span>
      <div style={{ display: "flex", gap: 24, justifyContent: "flex-start" }}>
        <label style={checkboxLabelStyle}>
          <input type="checkbox" checked disabled style={checkboxInputStyle} />
          עברית
        </label>
        <label style={checkboxLabelStyle}>
          <input
            type="checkbox"
            checked={showRu}
            disabled={readOnly}
            onChange={(e) => onChangeRu(e.target.checked)}
            style={checkboxInputStyle}
          />
          רוסית
        </label>
        <label style={checkboxLabelStyle}>
          <input
            type="checkbox"
            checked={showEn}
            disabled={readOnly}
            onChange={(e) => onChangeEn(e.target.checked)}
            style={checkboxInputStyle}
          />
          אנגלית
        </label>
      </div>
    </div>
  );
}
