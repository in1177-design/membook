import { dsFocusRing, dsTokens } from "./tokens";

// Real CSS (not inline styles) is required here — :hover and :focus-visible
// can't be expressed as an inline `style` prop, and even if they could, an
// inline style always wins over a stylesheet rule for the same property, so
// there'd be nothing left for a stylesheet rule to actually change. Mount
// <DesignSystemStyles /> once per page that renders PrimaryButton,
// SecondaryButton, or Toggle.
export const DS_STYLES = `
  .ds-btn-primary {
    padding: 13px 20px;
    border-radius: ${dsTokens.primaryButton.radius}px;
    border: none;
    background: ${dsTokens.primaryButton.color};
    color: ${dsTokens.primaryButton.textColor};
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.12s ease;
  }
  .ds-btn-primary:hover { background: ${dsTokens.primaryButton.hoverColor}; }
  .ds-btn-primary:focus-visible {
    outline: ${dsFocusRing.width}px solid ${dsFocusRing.color};
    outline-offset: ${dsFocusRing.offset}px;
  }
  .ds-btn-primary:disabled { opacity: 0.6; cursor: default; }

  .ds-btn-secondary {
    padding: 12px 20px;
    border-radius: ${dsTokens.secondaryButton.radius}px;
    border: 1px solid ${dsTokens.secondaryButton.borderColor};
    background: none;
    color: ${dsTokens.secondaryButton.color};
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.12s ease, border-color 0.12s ease;
  }
  .ds-btn-secondary:hover {
    background: ${dsTokens.secondaryButton.hoverBackground};
    border-color: ${dsTokens.secondaryButton.hoverBorderColor};
  }
  .ds-btn-secondary:focus-visible {
    outline: ${dsFocusRing.width}px solid ${dsFocusRing.color};
    outline-offset: ${dsFocusRing.offset}px;
  }
  .ds-btn-secondary:disabled { opacity: 0.6; cursor: default; }

  .ds-toggle {
    display: inline-flex;
    padding: 3px;
    border-radius: ${dsTokens.toggle.radius}px;
    background: ${dsTokens.toggle.background};
    border: 1px solid ${dsTokens.toggle.borderColor};
  }
  .ds-toggle-btn {
    padding: 6px 14px;
    font-size: 12px;
    font-weight: 700;
    border-radius: ${dsTokens.toggle.radius}px;
    border: none;
    background: transparent;
    color: ${dsTokens.toggle.inactiveTextColor};
    cursor: pointer;
    transition: background 0.12s ease;
  }
  .ds-toggle-btn:hover:not(.active) { background: ${dsTokens.toggle.hoverBackground}; }
  .ds-toggle-btn.active { background: ${dsTokens.toggle.activeColor}; color: #fff; }
  .ds-toggle-btn:focus-visible {
    outline: ${dsFocusRing.width}px solid ${dsFocusRing.color};
    outline-offset: ${dsFocusRing.offset}px;
  }

  .ds-progress-pills { display: flex; gap: ${dsTokens.progressPill.gap}px; }
  .ds-progress-pill {
    flex: 1;
    height: ${dsTokens.progressPill.height}px;
    border-radius: ${dsTokens.progressPill.radius}px;
    background: ${dsTokens.progressPill.trackColor};
  }
  .ds-progress-pill.filled { background: ${dsTokens.progressPill.filledColor}; }
`;

// Mount this once per page/tree that uses PrimaryButton, SecondaryButton,
// Toggle, or ProgressPills — same pattern SubmissionWizard.tsx already uses
// for its own <style>{BOOK_STYLES}</style>.
export function DesignSystemStyles() {
  return <style>{DS_STYLES}</style>;
}
