import { useId } from 'react';
import type { ApplicationArea } from '../../schedule/application';

interface Props { area: ApplicationArea; label: string; excludeNoseCorners: boolean; compact?: boolean }

const DESC: Record<ApplicationArea, string> = {
  face: 'Face outline with the forehead, cheeks, nose and chin highlighted. Eye contour and lips are hatched to keep clear.',
  'face-neck': 'Face and neck highlighted. Eye contour and lips are hatched to keep clear.',
  'face-neck-ears': 'Face, neck and ears highlighted. Eye contour and lips are hatched to keep clear.',
  spots: 'Face outline with a few small dots marking spot-only application. Eye contour and lips are hatched to keep clear.',
  'eye-contour': 'Face outline with only the orbital bone under and beside each eye highlighted; the eye itself is hatched.',
  lips: 'Face outline with only the lips highlighted.',
  body: 'Body outline with arms, legs and torso highlighted; the face is not.',
  underarms: 'Body outline with only the underarms highlighted.',
  feet: 'Sole of a foot with the heel and forefoot highlighted. Never use this product on the face.',
  scalp: 'Head outline with the scalp and roots highlighted; the face is not.',
  lengths: 'Head with hair falling to the shoulders; the mid-lengths and ends are highlighted, the roots are not.',
  beard: 'Face outline with the beard area along the jaw and neck highlighted.',
  mouth: 'Face outline with only the mouth highlighted; the skin around it is not.',
  other: 'Plain body outline with nothing highlighted — placement follows the label.',
};

const FACE_AREAS = new Set<ApplicationArea>(['face', 'face-neck', 'face-neck-ears', 'spots', 'eye-contour', 'lips', 'beard', 'mouth']);
const HAIR_AREAS = new Set<ApplicationArea>(['scalp', 'lengths']);

/** Accessible schematic of where a step goes on: teal = apply, hatched = keep clear. Not a map of anyone's skin. */
export function ApplicationMap({ area, label, excludeNoseCorners, compact = false }: Props) {
  const id = useId();
  const hatch = `${id}-hatch`;
  return (
    <svg viewBox="0 0 240 280" width={compact ? 120 : 200} height={compact ? 140 : 233} role="img" aria-labelledby={`${id}-t ${id}-d`} focusable="false"
      className="app-map mx-auto block max-w-full">
      <title id={`${id}-t`}>{label}</title>
      <desc id={`${id}-d`}>{DESC[area]}</desc>
      <defs>
        <pattern id={hatch} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" className="app-map-hatch" />
        </pattern>
      </defs>
      {FACE_AREAS.has(area) && <FaceMap area={area} hatch={hatch} excludeNoseCorners={excludeNoseCorners} />}
      {HAIR_AREAS.has(area) && <HairMap area={area} />}
      {(area === 'body' || area === 'underarms' || area === 'other') && <BodyMap area={area} />}
      {area === 'feet' && <FootMap />}
    </svg>
  );
}

function FaceMap({ area, hatch, excludeNoseCorners }: { area: ApplicationArea; hatch: string; excludeNoseCorners: boolean }) {
  const whole = area === 'face' || area === 'face-neck' || area === 'face-neck-ears';
  const neck = area === 'face-neck' || area === 'face-neck-ears' || area === 'beard';
  return (
    <g>
      <path d="M40 280 Q60 236 92 232 L148 232 Q180 236 200 280" className={neck && area !== 'beard' ? 'app-map-on' : 'app-map-skin'} />
      <rect x="92" y="186" width="56" height="50" rx="10" className={neck ? 'app-map-on' : 'app-map-skin'} />
      <ellipse cx="50" cy="120" rx="10" ry="18" className={area === 'face-neck-ears' ? 'app-map-on' : 'app-map-skin'} />
      <ellipse cx="190" cy="120" rx="10" ry="18" className={area === 'face-neck-ears' ? 'app-map-on' : 'app-map-skin'} />
      <ellipse cx="120" cy="118" rx="68" ry="84" className={whole ? 'app-map-on' : 'app-map-skin'} />
      {area === 'beard' && <path d="M60 140 Q70 214 120 218 Q170 214 180 140 Q160 178 120 184 Q80 178 60 140 Z" className="app-map-on" />}
      {area === 'spots' && [[100, 72], [146, 80], [82, 142], [158, 150], [120, 186]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="6" className="app-map-on" />)}
      {area === 'eye-contour' && (
        <>
          <path d="M70 108 Q94 130 118 108" className="app-map-stroke" />
          <path d="M122 108 Q146 130 170 108" className="app-map-stroke" />
        </>
      )}
      {area === 'lips' || area === 'mouth'
        ? <ellipse cx="120" cy="168" rx={area === 'mouth' ? 24 : 18} ry={area === 'mouth' ? 11 : 8} className="app-map-on" />
        : <ellipse cx="120" cy="168" rx="18" ry="8" fill={`url(#${hatch})`} className="app-map-off" />}
      {area === 'mouth' && <path d="M100 168 L140 168" className="app-map-line" />}
      <ellipse cx="94" cy="104" rx="22" ry="13" fill={`url(#${hatch})`} className="app-map-off" />
      <ellipse cx="146" cy="104" rx="22" ry="13" fill={`url(#${hatch})`} className="app-map-off" />
      <path d="M120 112 L112 146 Q120 152 128 146 Z" className="app-map-line" />
      {excludeNoseCorners && (
        <>
          <circle cx="106" cy="146" r="7" fill={`url(#${hatch})`} className="app-map-off" />
          <circle cx="134" cy="146" r="7" fill={`url(#${hatch})`} className="app-map-off" />
        </>
      )}
    </g>
  );
}

function HairMap({ area }: { area: ApplicationArea }) {
  const lengths = area === 'lengths';
  return (
    <g>
      <path d="M52 110 Q38 180 44 272 L88 272 Q80 190 88 132 Z" className="app-map-skin" />
      <path d="M188 110 Q202 180 196 272 L152 272 Q160 190 152 132 Z" className="app-map-skin" />
      {lengths && (
        <>
          <path d="M44 176 Q40 220 44 272 L88 272 Q84 220 84 176 Z" className="app-map-on" />
          <path d="M196 176 Q200 220 196 272 L152 272 Q156 220 156 176 Z" className="app-map-on" />
        </>
      )}
      <rect x="92" y="186" width="56" height="50" rx="10" className="app-map-skin" />
      <ellipse cx="120" cy="118" rx="68" ry="84" className="app-map-skin" />
      <path d="M52 118 Q52 34 120 34 Q188 34 188 118 Q160 96 120 92 Q80 96 52 118 Z" className={lengths ? 'app-map-skin' : 'app-map-on'} />
      <path d="M120 112 L112 146 Q120 152 128 146 Z" className="app-map-line" />
    </g>
  );
}

function BodyMap({ area }: { area: ApplicationArea }) {
  const all = area === 'body';
  const cls = all ? 'app-map-on' : 'app-map-skin';
  return (
    <g>
      <circle cx="120" cy="30" r="18" className="app-map-skin" />
      <rect x="112" y="46" width="16" height="14" className={cls} />
      <path d="M84 58 L156 58 Q170 60 172 78 L176 150 L64 150 L68 78 Q70 60 84 58 Z" className={cls} />
      <path d="M68 66 L50 160 L70 164 L86 84 Z" className={cls} />
      <path d="M172 66 L190 160 L170 164 L154 84 Z" className={cls} />
      <path d="M64 150 L176 150 L168 200 L72 200 Z" className={cls} />
      <path d="M72 200 L70 272 L106 272 L114 210 Z" className={cls} />
      <path d="M126 210 L134 272 L170 272 L168 200 Z" className={cls} />
      {!all && (
        <>
          <ellipse cx="84" cy="84" rx="12" ry="14" className="app-map-on" />
          <ellipse cx="156" cy="84" rx="12" ry="14" className="app-map-on" />
        </>
      )}
    </g>
  );
}

function FootMap() {
  return (
    <g>
      <path d="M120 262 C82 262 70 222 78 172 C84 132 78 92 96 52 C108 28 132 26 146 50 C162 74 166 112 158 152 C152 192 166 262 120 262 Z" className="app-map-skin" />
      <ellipse cx="120" cy="226" rx="30" ry="26" className="app-map-on" />
      <ellipse cx="122" cy="86" rx="36" ry="32" className="app-map-on" />
    </g>
  );
}
