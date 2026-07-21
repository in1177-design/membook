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
