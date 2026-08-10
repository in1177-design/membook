"use client";

import type { ReactNode } from "react";
import { PrimaryButton, SecondaryButton } from "./Button";

// The mobile bottom-nav pattern used throughout the guest wizard
// (StepBottomNav, Step 5's send/back actions): a full-width primary action
// stacked above a full-width secondary/back action. column-reverse (not
// column) so the primary button renders visually on top while still being
// declared second in the JSX — matches the DOM order used everywhere else
// this pattern appears.
export function MobileButtonStack({
  primaryLabel,
  secondaryLabel,
  onPrimaryClick,
  onSecondaryClick,
  primaryDisabled,
  secondaryDisabled,
}: {
  primaryLabel: ReactNode;
  secondaryLabel: ReactNode;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
  primaryDisabled?: boolean;
  secondaryDisabled?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column-reverse", alignItems: "stretch", gap: 10 }}>
      <SecondaryButton onClick={onSecondaryClick} disabled={secondaryDisabled} style={{ width: "100%" }}>
        {secondaryLabel}
      </SecondaryButton>
      <PrimaryButton onClick={onPrimaryClick} disabled={primaryDisabled} style={{ width: "100%" }}>
        {primaryLabel}
      </PrimaryButton>
    </div>
  );
}
