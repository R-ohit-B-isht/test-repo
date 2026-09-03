import { lazy, Suspense } from 'react';
import { usePrefersReducedMotion } from '../../lib/format';

const DotMatrix = lazy(() =>
  import('@designcodeio/threeui/components/DotMatrixBackground').then((m) => ({ default: m.DotMatrixBackground })),
);

/** ThreeUI dot-matrix shader, restricted to the hero band, code-split, and skipped for reduced-motion users / no WebGL. */
export function HeroMatrix() {
  const reduced = usePrefersReducedMotion();
  if (reduced || !hasWebGL()) return <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,#1a1a1a,transparent_60%)]" />;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden [mask-image:linear-gradient(to_bottom,black_40%,transparent)]">
      <Suspense fallback={null}>
        <DotMatrix className="absolute inset-0 h-full w-full" speed={0.5} gridScale={48} opacity={0.22} pulseSpeed={0.25} radius={0.12} mouseAmount={0.02} />
      </Suspense>
    </div>
  );
}

let webgl: boolean | null = null;
function hasWebGL() {
  if (webgl !== null) return webgl;
  try {
    const c = document.createElement('canvas');
    webgl = !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { webgl = false; }
  return webgl;
}
