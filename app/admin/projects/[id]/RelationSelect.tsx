"use client";

import { useState } from "react";

const RELATION_OPTIONS = ["ילדים", "קרבה משפחה", "חברי משפחה", "חבר/חברה/חברים"];

export default function RelationSelect({ initialValue }: { initialValue?: string }) {
  const knownValue = initialValue && RELATION_OPTIONS.includes(initialValue) ? initialValue : "";
  const unknownValue = initialValue && !RELATION_OPTIONS.includes(initialValue) ? initialValue : "";
  const [isOther, setIsOther] = useState(Boolean(unknownValue));

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <select
        name="relation"
        defaultValue={unknownValue ? "__other__" : knownValue}
        onChange={(e) => setIsOther(e.target.value === "__other__")}
        style={{ padding: "8px 10px", fontSize: 15, border: "1px solid #ccc", borderRadius: 6 }}
      >
        <option value="">קרבה</option>
        {RELATION_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
        <option value="__other__">+ הוספת קרבה אחרת</option>
      </select>
      {isOther && (
        <input
          name="relationOther"
          defaultValue={unknownValue}
          placeholder="קרבה אחרת"
          style={{ padding: "8px 10px", fontSize: 15, border: "1px solid #ccc", borderRadius: 6 }}
        />
      )}
    </div>
  );
}
