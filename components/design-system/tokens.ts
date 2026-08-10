// Single source of truth for the shared UI components (Toggle, PrimaryButton,
// SecondaryButton) below. Each component reads ONLY from its own entry here
// — change a color/radius on this object and every place that renders that
// component picks it up automatically, nothing else to touch.

// System-wide named colors — everything below (buttons, focus ring) points
// back at these instead of repeating its own hex literal, so "the primary
// color" genuinely lives in exactly one place.
export const dsColors = {
  // The one brand color used everywhere in the guest wizard's mobile
  // redesign (buttons, focus ring, links).
  primary: "#5838b8",
  // Admin-only accents, sampled straight from the main admin menu
  // (ProjectSidebar.tsx): its dark sidebar background and its orange
  // active-state/accent color.
  adminGray: "#1e1f25",
  adminOrange: "#ff5c00",
} as const;

export const dsTokens = {
  primaryButton: {
    name: "כפתור ראשי",
    color: dsColors.primary,
    hoverColor: "#4a2f97", // ~15% darker
    textColor: "#fff",
    radius: 10,
  },
  secondaryButton: {
    name: "כפתור משני",
    // Secondary button has no fill — this is its text/icon color.
    color: dsColors.primary,
    // The darker, corrected border tone (the lighter #e6e4e0 it started as
    // read as "invisible" per user feedback on Step 5's back button).
    borderColor: "#c9c7c2",
    // Light lavender fill on hover — the same tint already used elsewhere
    // in the guest wizard (textarea/photo-dropzone backgrounds).
    hoverBackground: "#f5f3ff",
    hoverBorderColor: "#a8a6a0",
    radius: 10,
  },
  toggle: {
    name: "טוגל",
    background: "#f1efe9",
    borderColor: "#e2e8f0",
    activeColor: "#1a1d23",
    inactiveTextColor: "#9199aa",
    // Hover fill for an inactive (not currently selected) segment.
    hoverBackground: "#e9e7e2",
    radius: 999,
  },
  // The segmented step-progress bar at the top of every guest-wizard step
  // (StepProgress in SubmissionBook.tsx).
  progressPill: {
    name: "פס התקדמות (Progress Pill)",
    filledColor: dsColors.primary,
    trackColor: "#e6e4e0",
    height: 4,
    gap: 6,
    radius: 999,
  },
} as const;

export type DsTokens = typeof dsTokens;

// A visible keyboard-focus ring shared by every interactive component here
// (buttons, toggle segments) — same outline color/offset everywhere so
// focus always looks the same regardless of which component it lands on.
export const dsFocusRing = {
  color: dsColors.primary,
  width: 2,
  offset: 2,
};
