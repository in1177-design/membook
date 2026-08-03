const EVENT_TYPE_EMOJI: Record<string, string> = {
  "חתונה": "💍",
  "חתונת זהב": "💛",
  "יום הולדת": "🎂",
  "בר מצווה": "1️⃣3️⃣",
  "בת מצווה": "1️⃣2️⃣",
  "ברית": "👶",
  "בריתה": "👶",
  "אירוסין": "💍",
  "יובל": "🎉",
  "ספר זיכרון": "🕯️",
};

export function emojiFor(type: string | null | undefined): string {
  if (!type) return "🎉";
  return EVENT_TYPE_EMOJI[type] ?? "🎉";
}

// The "celebrant names" field's label reads differently depending on the kind
// of event — matched by substring so both "חתונה" and "חתונת זהב" (etc.) hit
// the same rule without listing every exact event-type string.
export function celebrantLabelFor(type: string | null | undefined): string {
  if (!type) return "שם/שמות החוגגים";
  if (type.includes("חתונה") || type.includes("אירוסין") || type.includes("יובל")) return "שמות בני הזוג";
  if (type.includes("יום הולדת")) return "שם החוגג/ת";
  if (type.includes("ספר זיכרון")) return "שם לזכרו";
  return "שם/שמות החוגגים";
}
