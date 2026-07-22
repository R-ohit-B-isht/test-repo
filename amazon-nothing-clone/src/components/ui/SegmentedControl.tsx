interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

// Segmented control per components.md §8: 1px border container, active segment
// inverts (text-display bg / black text), inactive transparent/secondary.
export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: Props<T>) {
  return (
    <div
      className={`inline-flex rounded-sm border border-border-visible p-[2px] ${className ?? ""}`}
      role="tablist"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            data-transition
            onClick={() => onChange(opt.value)}
            className={[
              "min-h-[36px] px-md font-body text-label uppercase tracking-[0.08em] rounded-[6px]",
              active
                ? "bg-text-display text-black"
                : "bg-transparent text-text-secondary hover:text-text-primary",
            ].join(" ")}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
