import SegmentedBar from "./SegmentedBar";

interface Props {
  /** 0.0 – 5.0 */
  value: number;
  reviews?: number;
  size?: "hero" | "standard" | "compact";
  className?: string;
}

// Ratings as a segmented bar (not filled stars — no multi-colour icons).
// 10 segments = half-star resolution. Numeric readout always shown alongside.
export default function Rating({ value, reviews, size = "compact", className }: Props) {
  const total = 10;
  const filled = Math.round((value / 5) * total);
  return (
    <div className={`flex items-center gap-sm ${className ?? ""}`}>
      <SegmentedBar filled={filled} total={total} size={size} className="w-24" />
      <span className="font-body text-body-sm text-text-primary">
        {value.toFixed(1)}
      </span>
      {reviews !== undefined && (
        <span className="font-body text-label uppercase tracking-[0.08em] text-text-disabled">
          {reviews.toLocaleString()} REV
        </span>
      )}
    </div>
  );
}
