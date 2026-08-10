"use client";

import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement>;

// The main call-to-action button (e.g. "המשך", "שליחה", "בואי נתחיל").
// All styling — including :hover/:focus-visible — lives in styles.tsx's
// .ds-btn-primary rule (see DS_STYLES); mount <DesignSystemStyles /> once
// per page that renders this. `style`/`className` still layer on top for
// one-off overrides, same as any other button.
export function PrimaryButton({ className, ...props }: Props) {
  return <button type="button" className={`ds-btn-primary${className ? ` ${className}` : ""}`} {...props} />;
}

// The secondary/"back" action next to a PrimaryButton (e.g. "חזרה לשלב
// הקודם", "חזרה לעריכה") — same footprint (radius, padding, font) so the
// pair lines up, but a quiet bordered-ghost look instead of a filled one.
export function SecondaryButton({ className, ...props }: Props) {
  return <button type="button" className={`ds-btn-secondary${className ? ` ${className}` : ""}`} {...props} />;
}
