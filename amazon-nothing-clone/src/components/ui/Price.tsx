interface Props {
  amount: number;
  /** Hero uses the display face at large size (primary layer). */
  size?: "hero" | "lg" | "md" | "sm";
  className?: string;
}

const SIZES = {
  hero: "text-display-xl",
  lg: "text-display-lg",
  md: "text-heading",
  sm: "text-body",
};

// Price readout. Currency mark sits adjacent in label size, slightly raised —
// "number + unit belong together" (tight spacing). Hero size uses the display
// face and is the ONE primary element on the product screen.
export default function Price({ amount, size = "md", className }: Props) {
  const isHero = size === "hero" || size === "lg";
  return (
    <span
      className={[
        "inline-flex items-start tabular-nums text-text-display",
        isHero ? "font-display" : "font-body",
        SIZES[size],
        className ?? "",
      ].join(" ")}
    >
      <span className="mr-[2px] mt-[0.35em] text-label tracking-[0.08em] text-text-secondary">
        USD
      </span>
      {amount.toLocaleString()}
    </span>
  );
}
