"use client";

import type { ReactNode } from "react";

export type ToggleOption<T extends string> = { value: T; label: ReactNode; ariaLabel?: string };

// The segmented pill switch (e.g. desktop/mobile device preview, HE/RU/EN
// language) — a controlled component, same pattern used by
// PreviewDeviceFrame.tsx today. Styling (including :hover/:focus-visible)
// lives in styles.tsx's .ds-toggle/.ds-toggle-btn rules; mount
// <DesignSystemStyles /> once per page that renders this.
export function Toggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: ToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="ds-toggle">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            className={`ds-toggle-btn${active ? " active" : ""}`}
            onClick={() => onChange(opt.value)}
            aria-label={opt.ariaLabel}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
