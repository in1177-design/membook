"use client";

import { useState } from "react";
import { emojiFor } from "./eventTypeEmoji";
import { inputStyle } from "./formStyles";

type Props = {
  options: string[];
  initialValue?: string;
  onValueChange?: (value: string) => void;
  readOnly?: boolean;
};

export default function EventTypeSelect({ options, initialValue, onValueChange, readOnly }: Props) {
  const knownValue = initialValue && options.includes(initialValue) ? initialValue : "";
  const unknownValue = initialValue && !options.includes(initialValue) ? initialValue : "";
  const [isNew, setIsNew] = useState(Boolean(unknownValue));

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <select
        name="eventType"
        defaultValue={unknownValue ? "__new__" : knownValue}
        disabled={readOnly}
        onChange={(e) => {
          const value = e.target.value;
          setIsNew(value === "__new__");
          onValueChange?.(value === "__new__" ? "" : value);
        }}
        style={{ ...inputStyle, cursor: readOnly ? "default" : "pointer" }}
      >
        <option value="">סוג האירוע</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {emojiFor(opt)} {opt}
          </option>
        ))}
        <option value="__new__">+ הוספת סוג חדש</option>
      </select>
      {isNew && (
        <input
          name="eventTypeNew"
          defaultValue={unknownValue}
          placeholder="שם הסוג החדש"
          disabled={readOnly}
          onChange={(e) => onValueChange?.(e.target.value)}
          style={inputStyle}
        />
      )}
    </div>
  );
}
