import type { HTMLAttributes } from "react";

type Tone = "secondary" | "disabled" | "primary" | "accent";

const TONES: Record<Tone, string> = {
  secondary: "text-text-secondary",
  disabled: "text-text-disabled",
  primary: "text-text-primary",
  accent: "text-accent",
};

// Instrument-panel label: NType 82, ALL CAPS, 0.08em tracking, 11px.
// Used everywhere a tertiary label is needed (nav, field labels, stat keys).
export default function Label({
  tone = "secondary",
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={[
        "font-body text-label uppercase tracking-[0.08em]",
        TONES[tone],
        className ?? "",
      ].join(" ")}
      {...rest}
    >
      {children}
    </span>
  );
}
