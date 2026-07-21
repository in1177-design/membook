"use client";

import { useState } from "react";
import { emojiFor } from "./eventTypeEmoji";

export default function EventTypeSelect({ options, initialValue }: { options: string[]; initialValue?: string }) {
  const knownValue = initialValue && options.includes(initialValue) ? initialValue : "";
  const unknownValue = initialValue && !options.includes(initialValue) ? initialValue : "";
  const [isNew, setIsNew] = useState(Boolean(unknownValue));

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <select
        name="eventType"
        defaultValue={unknownValue ? "__new__" : knownValue}
        onChange={(e) => setIsNew(e.target.value === "__new__")}
        style={{ padding: "8px 10px", fontSize: 15, border: "1px solid #ccc", borderRadius: 6 }}
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
          style={{ padding: "8px 10px", fontSize: 15, border: "1px solid #ccc", borderRadius: 6 }}
        />
      )}
    </div>
  );
}
