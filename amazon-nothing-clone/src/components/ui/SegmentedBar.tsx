type Status = "neutral" | "good" | "moderate" | "over";

interface Props {
  /** Number of filled segments. */
  filled: number;
  /** Total segments. */
  total: number;
  status?: Status;
  /** Segment height. Hero 16-20, standard 8-12, compact 4-6 (components.md §11). */
  size?: "hero" | "standard" | "compact";
  className?: string;
}

// The signature Nothing data-viz: discrete square-ended blocks with 2px gaps.
// Filled = solid status colour, empty = --segment-empty. No border-radius.
const FILL: Record<Status, string> = {
  neutral: "bg-text-display",
  good: "bg-success",
  moderate: "bg-warning",
  over: "bg-accent",
};

const HEIGHT = {
  hero: "h-[18px]",
  standard: "h-[10px]",
  compact: "h-[5px]",
};

export default function SegmentedBar({
  filled,
  total,
  status = "neutral",
  size = "standard",
  className,
}: Props) {
  return (
    <div className={`flex gap-[2px] ${className ?? ""}`} aria-hidden="true">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`flex-1 ${HEIGHT[size]} ${
            i < filled ? FILL[status] : "bg-[var(--segment-empty)]"
          }`}
        />
      ))}
    </div>
  );
}
