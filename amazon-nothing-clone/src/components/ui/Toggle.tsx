interface Props {
  on: boolean;
  onChange: () => void;
  label?: string;
}

// Mechanical switch per components.md §10: pill track, circle thumb.
// Off = border-visible track / disabled thumb. On = display track / black thumb.
// Reads as a physical toggle — controls look like controls.
export default function Toggle({ on, onChange, label }: Props) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      data-transition
      className="inline-flex h-[28px] w-[48px] items-center rounded-pill border border-border-visible p-[3px]"
      style={{ backgroundColor: on ? "var(--text-display)" : "transparent" }}
    >
      <span
        data-transition
        className="h-[20px] w-[20px] rounded-pill"
        style={{
          backgroundColor: on ? "var(--black)" : "var(--text-disabled)",
          transform: on ? "translateX(20px)" : "translateX(0px)",
        }}
      />
    </button>
  );
}
