// Shared design tokens for the project create/edit form, matching the Figma
// "project-settings" mockup (colors, radii, spacing, typography).

export const colors = {
  textPrimary: "#1a1d23",
  textSecondary: "#4e5565",
  textLabel: "#9199aa",
  sectionHeader: "#1400c8",
  inputBg: "#fafbfc",
  border: "#e2e8f0",
  accent: "#4a6c9b",
  buttonDark: "#1a1d23",
  // Used for the small captions that guide the admin above each editable
  // field on the "build" page (e.g. "כותרת:", "טקסט הנחיה לברכה") — per the
  // Setup2 sketches, distinct from the plain-gray section/step label above it.
  guidanceOrange: "#e07b1a",
};

export const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 700,
  color: colors.textLabel,
  marginBottom: 6,
};

export const sectionHeaderStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  color: colors.sectionHeader,
  margin: 0,
};

export const inputStyle: React.CSSProperties = {
  padding: "10px 14px",
  fontSize: 14,
  color: colors.textPrimary,
  background: colors.inputBg,
  border: `1px solid ${colors.border}`,
  borderRadius: 10,
  width: "100%",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

// Russian/English are LTR languages — their typed text should read left-to-right
// and hug the left edge, even though the surrounding page is RTL.
export const ltrInputStyle: React.CSSProperties = {
  ...inputStyle,
  direction: "ltr",
  textAlign: "left",
};

export const rowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 16,
};

export const buttonStyle: React.CSSProperties = {
  padding: "12px 24px",
  fontSize: 14,
  fontWeight: 700,
  background: colors.buttonDark,
  color: "white",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  width: "100%",
};

export const secondaryButtonStyle: React.CSSProperties = {
  padding: "8px 16px",
  fontSize: 13,
  fontWeight: 600,
  background: "white",
  color: colors.accent,
  border: `1px solid ${colors.border}`,
  borderRadius: 8,
  cursor: "pointer",
  width: "auto",
};

export const dividerStyle: React.CSSProperties = {
  border: "none",
  borderTop: `1px solid ${colors.border}`,
  margin: 0,
  width: "100%",
};

export const checkboxInputStyle: React.CSSProperties = {
  width: 18,
  height: 18,
  accentColor: colors.accent,
  cursor: "pointer",
};

export const checkboxLabelStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 14,
  color: colors.textSecondary,
  cursor: "pointer",
};

// Matches the "מוזמנים" table's card on the project detail page
// (InviteesTable.tsx's cardStyle) — same white box, border, radius, padding
// and shadow, so a page with several of these side by side (e.g. project
// settings) reads as the same visual system.
export const cardStyle: React.CSSProperties = {
  background: "white",
  border: "1px solid #eee",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
};
