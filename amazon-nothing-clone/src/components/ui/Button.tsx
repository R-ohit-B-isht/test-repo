import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "destructive";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  full?: boolean;
}

// Buttons per components.md §2. NType 82, 13px, ALL CAPS, 0.06em tracking,
// min-height 44px. Primary is a white pill; no shadows, no gradients.
const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-text-display text-black border border-text-display hover:opacity-90 rounded-pill",
  secondary:
    "bg-transparent text-text-primary border border-border-visible hover:border-text-primary rounded-pill",
  ghost:
    "bg-transparent text-text-secondary border-none hover:text-text-primary rounded-none",
  destructive:
    "bg-transparent text-accent border border-accent hover:bg-accent-subtle rounded-pill",
};

export default function Button({
  variant = "primary",
  full,
  className,
  children,
  ...rest
}: Props) {
  return (
    <button
      data-transition
      className={[
        "inline-flex min-h-[44px] items-center justify-center gap-sm",
        "px-lg py-md font-body text-[13px] uppercase tracking-[0.06em]",
        "disabled:opacity-40 disabled:pointer-events-none",
        VARIANTS[variant],
        full ? "w-full" : "",
        className ?? "",
      ].join(" ")}
      {...rest}
    >
      {children}
    </button>
  );
}
