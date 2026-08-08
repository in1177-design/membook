// Plain data/constants shared between the server page (app/i/[token]/page.tsx)
// and client components (SubmissionWizard, the admin "build" page, etc.).
// Deliberately has zero server-only imports (no prisma, no next/headers) so
// that client components can import from it directly without accidentally
// pulling the whole server module graph (fs/net/tls/dns) into the browser
// bundle — which is exactly what happened when these lived in page.tsx and a
// "use client" component imported a value export from it.

import type { Lang } from "./types";

export const CONTENT: Record<
  string,
  {
    eyebrow: string;
    intro: string;
    photoLabel: string;
    photoHint: string;
    submitLabel: string;
    dateLocationLabel: string;
    dateLocationPlaceholder: string;
    backToEditLabel: string;
    answersHeading: string;
    startLabel: string;
    nextLabel: string;
    backLabel: string;
  }
> = {
  HE: {
    eyebrow: "אלבום זיכרון",
    intro: "שמחים שהצטרפת! נשמח אם תעני על השאלות למטה.",
    photoLabel: "לחצי או גררי להעלאת תמונה",
    photoHint: "JPG · PNG · WEBP",
    submitLabel: "אישור ושליחה",
    dateLocationLabel: "תאריך ומקום",
    dateLocationPlaceholder: "למשל: יולי 2026 · תל אביב",
    backToEditLabel: "חזרה לעריכה",
    answersHeading: "הסיפור שלך",
    startLabel: "בואי נתחיל",
    nextLabel: "הבא",
    backLabel: "הקודם",
  },
  RU: {
    eyebrow: "Альбом памяти",
    intro: "Мы рады, что вы с нами! Пожалуйста, ответьте на вопросы ниже.",
    photoLabel: "Нажмите или перетащите фото сюда",
    photoHint: "JPG · PNG · WEBP",
    submitLabel: "Подтвердить и отправить",
    dateLocationLabel: "Дата и место",
    dateLocationPlaceholder: "напр. июль 2026 · Тель-Авив",
    backToEditLabel: "Вернуться к редактированию",
    answersHeading: "Ваша история",
    startLabel: "Начнём",
    nextLabel: "Далее",
    backLabel: "Назад",
  },
  EN: {
    eyebrow: "Memory album",
    intro: "So glad you're here! Please answer the questions below.",
    photoLabel: "Click or drag to upload",
    photoHint: "JPG · PNG · WEBP",
    submitLabel: "Confirm & submit",
    dateLocationLabel: "Date & location",
    dateLocationPlaceholder: "e.g. July 2026 · Tel Aviv",
    backToEditLabel: "Back to editing",
    answersHeading: "Your story",
    startLabel: "Let's begin",
    nextLabel: "Next",
    backLabel: "Back",
  },
};

// Fallback for the PICK_ONE-only, per-language photo-request and blessing
// guidance text, used when a project hasn't set its own wording yet.
export const PICK_ONE_FALLBACK_TEXT: Record<string, { photoRequest: string; blessingPrompt: string }> = {
  HE: {
    photoRequest: "בחרו תמונה שתרצו לצרף לברכה — תמונה שלכם, תמונה משותפת עם בעלי השמחה, או תמונה מרגע מיוחד יחד.",
    blessingPrompt: "כמה מילים לברכה...",
  },
  RU: {
    photoRequest:
      "Выберите фотографию, которую хотите добавить к поздравлению — вашу фотографию, совместное фото с виновниками торжества или фотографию особенного момента вместе.",
    blessingPrompt: "Несколько слов поздравления...",
  },
  EN: {
    photoRequest:
      "Choose a photo you'd like to include with your message — a photo of you, a photo together with the people you're celebrating, or a photo from a special moment you shared.",
    blessingPrompt: "A few words of blessing...",
  },
};

export type IntroGuidance = {
  stepsHeading: string;
  steps: { title: string; body: string }[];
  closingHeading: string;
  closingBody: string;
};

// Fixed system copy shown once on the intro step, PICK_ONE projects only —
// walks the guest through the 3-step shape of the flow (bless, pick+answer,
// attach photo) before they start. Same for every project (the process itself
// never changes), so unlike introTexts/photoRequestTexts this isn't
// per-project editable — just translated per language.
export const PICK_ONE_INTRO_GUIDANCE: Record<string, IntroGuidance> = {
  HE: {
    stepsHeading: "הצעדים הפשוטים הבאים:",
    steps: [
      { title: "מברכים", body: "הוסיפו מילים חמות, איחולים וברכה מכל הלב." },
      {
        title: "בוחרים שאלה ועונים",
        body: "בחרו שאלה אחת מתוך הרשימה ושתפו סיפור קצר, זיכרון מיוחד או פרט חביב.",
      },
      { title: "מצרפים תמונה", body: "העלו תמונה שלכם, או תמונה משותפת." },
    ],
    closingHeading: "מה יקרה בסוף?",
    closingBody: "מכל הברכות, הזיכרונות והתמונות שיישלחו, ניצור אלבום מעוצב ושלם שיוענק במתנה מכל האורחים!",
  },
  RU: {
    stepsHeading: "Вот 3 простых шага:",
    steps: [
      { title: "Пожелайте", body: "Напишите тёплые слова, пожелания и поздравления от всего сердца." },
      {
        title: "Выберите вопрос и ответьте",
        body: "Выберите один вопрос из списка и поделитесь короткой историей, воспоминанием или особенным фактом.",
      },
      { title: "Прикрепите фото", body: "Загрузите ваше фото или общую фотографию." },
    ],
    closingHeading: "Что получится в итоге?",
    closingBody: "Из всех собранных пожеланий, воспоминаний и фотографий мы создадим красивый памятный альбом — подарок от всех гостей!",
  },
  EN: {
    stepsHeading: "Here are the 3 simple steps:",
    steps: [
      { title: "Send a blessing", body: "Add warm words, wishes, and a blessing from the heart." },
      {
        title: "Pick a question and answer it",
        body: "Choose one question from the list and share a short story, a special memory, or a fun detail.",
      },
      { title: "Attach a photo", body: "Upload a photo of yourself, or a shared one." },
    ],
    closingHeading: "What happens at the end?",
    closingBody: "From all the blessings, memories, and photos sent in, we'll create a beautiful, complete album as a gift from all the guests!",
  },
};

// Same idea, ALL-mode projects — guests answer every question (no blessing
// step, no picking one), so the process description is different, but the
// text is equally fixed/non-editable, just translated per language.
export const ALL_MODE_INTRO_GUIDANCE: Record<string, IntroGuidance> = {
  HE: {
    stepsHeading: "כך זה עובד:",
    steps: [
      { title: "עונים על השאלות", body: "ענו על כל השאלות שהכנו עבורכם — קצר או ארוך, כרצונכם." },
      { title: "מצרפים תמונה", body: "העלו תמונה שלכם, או תמונה משותפת." },
    ],
    closingHeading: "מה יקרה בסוף?",
    closingBody: "מכל התשובות והתמונות שיישלחו, ניצור אלבום מעוצב ושלם שיוענק במתנה מכל האורחים!",
  },
  RU: {
    stepsHeading: "Вот как это работает:",
    steps: [
      { title: "Ответьте на вопросы", body: "Ответьте на все вопросы, которые мы подготовили — коротко или подробно, как пожелаете." },
      { title: "Прикрепите фото", body: "Загрузите ваше фото или общую фотографию." },
    ],
    closingHeading: "Что получится в итоге?",
    closingBody: "Из всех собранных ответов и фотографий мы создадим красивый памятный альбом — подарок от всех гостей!",
  },
  EN: {
    stepsHeading: "Here's how it works:",
    steps: [
      { title: "Answer the questions", body: "Answer all the questions we've prepared — short or long, however you like." },
      { title: "Attach a photo", body: "Upload a photo of yourself, or a shared one." },
    ],
    closingHeading: "What happens at the end?",
    closingBody: "From all the answers and photos sent in, we'll create a beautiful, complete album as a gift from all the guests!",
  },
};

export function introGuidanceFor(mode: "ALL" | "PICK_ONE"): Record<string, IntroGuidance> {
  return mode === "PICK_ONE" ? PICK_ONE_INTRO_GUIDANCE : ALL_MODE_INTRO_GUIDANCE;
}

// "Step N of Total" — shared by the overall wizard progress bar and by
// individual steps' own Eyebrow (e.g. "Step 2 of 6 · Blessing & signature").
export const STEP_OF_LABEL: Record<Lang, (n: number, total: number) => string> = {
  HE: (n, total) => `שלב ${n} מתוך ${total}`,
  RU: (n, total) => `Шаг ${n} из ${total}`,
  EN: (n, total) => `Step ${n} of ${total}`,
};

// Shared short label for the "question" step's Eyebrow — used by both screens
// of that step (ChooseQuestionStep and AnswerQuestionStep) so they read as
// the same logical step ("Step 3 of 6 · The question") even though they're
// two separate screens in the flow.
export const QUESTION_SHORT_LABEL: Record<Lang, string> = { HE: "השאלה", RU: "Вопрос", EN: "Question" };

// Translations for the known event-type presets. Covers both the separate
// keys in app/admin/projects/eventTypeEmoji.ts AND the combined forms
// ("בר / בת מצווה", "ברית / בריתה") actually offered in EventTypeSelect's
// dropdown — those two files are already slightly out of sync with each
// other (pre-existing), so this maps whichever strings really end up stored.
// A project's eventType is a free string though (admins can type a custom
// one via "+ הוספת סוג חדש"), so this is a best-effort map, not an enum.
const EVENT_TYPE_LABELS: Record<string, Record<Lang, string>> = {
  "חתונה": { HE: "חתונה", RU: "Свадьба", EN: "Wedding" },
  "חתונת זהב": { HE: "חתונת זהב", RU: "Золотая свадьба", EN: "Golden wedding" },
  "יום הולדת": { HE: "יום הולדת", RU: "День рождения", EN: "Birthday" },
  "בר מצווה": { HE: "בר מצווה", RU: "Бар-мицва", EN: "Bar Mitzvah" },
  "בת מצווה": { HE: "בת מצווה", RU: "Бат-мицва", EN: "Bat Mitzvah" },
  "בר / בת מצווה": { HE: "בר / בת מצווה", RU: "Бар/Бат-мицва", EN: "Bar/Bat Mitzvah" },
  "ברית": { HE: "ברית", RU: "Брит-мила", EN: "Brit" },
  "בריתה": { HE: "בריתה", RU: "Брита", EN: "Britah" },
  "ברית / בריתה": { HE: "ברית / בריתה", RU: "Брит-мила / Брита", EN: "Brit / Britah" },
  "אירוסין": { HE: "אירוסין", RU: "Помолвка", EN: "Engagement" },
  "יובל": { HE: "יובל", RU: "Юбилей", EN: "Anniversary" },
  "ספר זיכרון": { HE: "ספר זיכרון", RU: "Книга памяти", EN: "Memory book" },
};

// Step 1's eyebrow shows the project's event type instead of a generic
// label. Known presets get translated; a custom (freeform) event type is
// shown as-is in every language (same fallback behavior as other untranslated
// free-text fields in this app); no event type at all falls back to the
// original generic eyebrow copy.
export function eventTypeLabelFor(eventType: string | null | undefined, lang: Lang): string {
  if (!eventType) return CONTENT[lang].eyebrow;
  return EVENT_TYPE_LABELS[eventType]?.[lang] ?? eventType;
}
