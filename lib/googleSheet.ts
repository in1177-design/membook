// Parses a Google Sheets share link into invitee candidates. Relies on Sheets'
// public CSV export endpoint, which works with no API key as long as the sheet
// is shared "Anyone with the link can view" — no OAuth needed.

export function extractSpreadsheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

// Minimal RFC4180-ish CSV parser: handles quoted fields, escaped quotes ("")
// inside quotes, commas/newlines inside quoted fields.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }

    if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

const NAME_HEADER_HINTS = ["שם", "name", "מוזמן", "אורח"];
const PHONE_HEADER_HINTS = ["טלפון", "נייד", "פלאפון", "phone", "מספר"];

// Guesses which columns hold the name/phone by header text; falls back to the
// first two columns if headers don't obviously match (e.g. no header row).
export function guessNamePhoneColumns(header: string[]): { nameIdx: number; phoneIdx: number } {
  const normalized = header.map((h) => h.trim().toLowerCase());
  const nameIdx = normalized.findIndex((h) => NAME_HEADER_HINTS.some((hint) => h.includes(hint)));
  const phoneIdx = normalized.findIndex((h) => PHONE_HEADER_HINTS.some((hint) => h.includes(hint)));

  return {
    nameIdx: nameIdx !== -1 ? nameIdx : 0,
    phoneIdx: phoneIdx !== -1 ? phoneIdx : (nameIdx === 1 ? 0 : 1),
  };
}

export function rowsLookLikeHeader(header: string[]): boolean {
  const normalized = header.map((h) => h.trim().toLowerCase());
  return normalized.some((h) => [...NAME_HEADER_HINTS, ...PHONE_HEADER_HINTS].some((hint) => h.includes(hint)));
}

// Israeli local numbers are dialed starting with 0 (e.g. 050-1234567); sheets
// often drop the leading 0 (Excel/Sheets treats the column as a number). Only
// touches plain digit-first numbers — leaves +972/international format alone.
export function normalizeIsraeliPhone(phone: string): string {
  const trimmed = phone.trim();
  if (!trimmed || trimmed.startsWith("0") || trimmed.startsWith("+")) return trimmed;
  if (/^\d/.test(trimmed)) return "0" + trimmed;
  return trimmed;
}
