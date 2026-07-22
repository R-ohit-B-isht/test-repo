interface Props {
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

// Filter tag / chip per components.md §7: 1px border, no fill, caption ALL CAPS.
// Active state = text-display border + text (never a filled background swatch).
export default function Chip({ label, active, onClick, className }: Props) {
  return (
    <button
      data-transition
      onClick={onClick}
      aria-pressed={active}
      className={[
        "rounded-pill border px-md py-xs font-body text-caption uppercase tracking-[0.06em]",
        active
          ? "border-text-display text-text-display"
          : "border-border-visible text-text-secondary hover:text-text-primary hover:border-text-primary",
        className ?? "",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
