// Shared print-resolution check for admin-facing "this photo might look bad
// printed" warnings (invitees table + album design board). Deliberately
// admin-only for now — see docs/רשימת-משימות-פתוחות.md — the guest-facing
// upload-time warning is a separate, not-yet-built follow-up.
//
// Threshold: ~150 DPI at a 16cm photo slot (a single photo within a 30×30cm
// album page, not the full page) ≈ 950px on the shorter side. Deliberately
// 150 DPI, not the "ideal" 300 DPI (~1900px) — 300 DPI would flag a large
// share of real guest photos forwarded through WhatsApp (which recompresses
// heavily), overwarning on images that still print acceptably for this kind
// of memory book.
export const MIN_PRINT_DIMENSION_PX = 950;

export function isLowResForPrint(width: number | null | undefined, height: number | null | undefined): boolean {
  if (!width || !height) return false; // unknown dimensions — nothing to flag
  return Math.min(width, height) < MIN_PRINT_DIMENSION_PX;
}
