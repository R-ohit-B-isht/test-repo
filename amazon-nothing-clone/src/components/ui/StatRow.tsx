import Label from "./Label";

type Status = "neutral" | "good" | "moderate" | "over";

interface Props {
  label: string;
  value: string;
  unit?: string;
  status?: Status;
  /** Emphasise as the summary total row. */
  strong?: boolean;
}

const VALUE_COLOR: Record<Status, string> = {
  neutral: "text-text-primary",
  good: "text-success",
  moderate: "text-warning",
  over: "text-accent",
};

// Stat row (components.md §4): label left (secondary caps), value right
// (colour = status). Unit adjacent in label size. Colour applies to the
// value, never the label or row background.
export default function StatRow({ label, value, unit, status = "neutral", strong }: Props) {
  return (
    <div className="flex items-baseline justify-between py-md">
      <Label tone="secondary">{label}</Label>
      <div className="flex items-baseline gap-xs">
        <span
          className={[
            "font-body tabular-nums",
            strong ? "text-heading" : "text-body",
            VALUE_COLOR[status],
          ].join(" ")}
        >
          {value}
        </span>
        {unit && (
          <span className="font-body text-label uppercase tracking-[0.08em] text-text-secondary">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
