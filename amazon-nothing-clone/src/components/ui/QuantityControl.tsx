import { Minus, Plus } from "lucide-react";
import Label from "./Label";

interface Props {
  qty: number;
  onChange: (qty: number) => void;
  min?: number;
  max?: number;
}

// Quantity as a segmented/mechanical control: [ − | N | + ] with divider rules.
// Thin monoline icons only, no fill.
export default function QuantityControl({ qty, onChange, min = 1, max = 99 }: Props) {
  const step = (d: number) => onChange(Math.min(max, Math.max(min, qty + d)));
  return (
    <div className="inline-flex items-stretch rounded-sm border border-border-visible">
      <button
        data-transition
        aria-label="Decrease quantity"
        onClick={() => step(-1)}
        disabled={qty <= min}
        className="flex h-[44px] w-[44px] items-center justify-center text-text-primary hover:bg-surface-raised disabled:opacity-40"
      >
        <Minus size={16} strokeWidth={1.5} />
      </button>
      <div className="flex w-[56px] items-center justify-center border-x border-border">
        <Label tone="primary" className="text-body-sm">
          {qty.toString().padStart(2, "0")}
        </Label>
      </div>
      <button
        data-transition
        aria-label="Increase quantity"
        onClick={() => step(1)}
        disabled={qty >= max}
        className="flex h-[44px] w-[44px] items-center justify-center text-text-primary hover:bg-surface-raised disabled:opacity-40"
      >
        <Plus size={16} strokeWidth={1.5} />
      </button>
    </div>
  );
}
