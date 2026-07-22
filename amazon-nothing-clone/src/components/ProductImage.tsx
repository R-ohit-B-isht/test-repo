import type { Silhouette } from "../data/products";

// Generated monochrome product silhouettes — monoline, 1.5px stroke, no fill,
// inherits currentColor. No scraped brand assets. Rendered on a subtle dot-grid
// so the catalog reads as an instrument panel rather than glossy photography.

interface Props {
  type: Silhouette;
  className?: string;
}

const PATHS: Record<Silhouette, React.ReactNode> = {
  headphone: (
    <>
      <path d="M16 34 V28 a16 16 0 0 1 32 0 V34" />
      <rect x="10" y="34" width="8" height="16" rx="2" />
      <rect x="46" y="34" width="8" height="16" rx="2" />
    </>
  ),
  earbud: (
    <>
      <rect x="20" y="14" width="10" height="22" rx="5" />
      <path d="M25 36 V50" />
      <rect x="36" y="20" width="10" height="22" rx="5" />
      <path d="M41 42 V54" />
    </>
  ),
  phone: (
    <>
      <rect x="22" y="8" width="20" height="48" rx="4" />
      <circle cx="30" cy="18" r="2.4" />
      <circle cx="30" cy="26" r="2.4" />
      <path d="M27 48 h10" />
    </>
  ),
  tablet: (
    <>
      <rect x="14" y="10" width="36" height="44" rx="4" />
      <path d="M22 48 h20" />
    </>
  ),
  laptop: (
    <>
      <rect x="14" y="14" width="36" height="24" rx="2" />
      <path d="M8 46 h48 l-4 -8 H12 Z" />
    </>
  ),
  keyboard: (
    <>
      <rect x="8" y="22" width="48" height="20" rx="2" />
      <path d="M14 28 h4 M22 28 h4 M30 28 h4 M38 28 h4 M46 28 h4 M18 36 h28" />
    </>
  ),
  mouse: (
    <>
      <rect x="24" y="14" width="16" height="36" rx="8" />
      <path d="M32 14 v12 M32 20 h0" />
    </>
  ),
  watch: (
    <>
      <rect x="24" y="22" width="16" height="20" rx="4" />
      <path d="M28 22 l1 -10 h6 l1 10 M28 42 l1 10 h6 l1 -10" />
    </>
  ),
  speaker: (
    <>
      <rect x="22" y="10" width="20" height="44" rx="4" />
      <circle cx="32" cy="24" r="5" />
      <circle cx="32" cy="42" r="3" />
    </>
  ),
  camera: (
    <>
      <rect x="12" y="20" width="40" height="26" rx="3" />
      <path d="M24 20 l3 -5 h10 l3 5" />
      <circle cx="32" cy="33" r="7" />
    </>
  ),
  battery: (
    <>
      <rect x="16" y="16" width="32" height="32" rx="3" />
      <path d="M24 26 h16 M24 32 h16 M24 38 h10" />
    </>
  ),
  bulb: (
    <>
      <path d="M32 10 a14 14 0 0 1 8 25 v5 H24 v-5 a14 14 0 0 1 8 -25 Z" />
      <path d="M26 50 h12 M28 54 h8" />
    </>
  ),
};

export default function ProductImage({ type, className }: Props) {
  return (
    <div
      className={`dot-grid flex items-center justify-center text-text-secondary ${className ?? ""}`}
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-1/2 w-1/2"
        aria-hidden="true"
      >
        {PATHS[type]}
      </svg>
    </div>
  );
}
