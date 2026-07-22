import type { ReactElement, SVGProps } from 'react'

/*
  SF-Symbol-style monoline glyphs. These are original, simple monoline icons
  drawn to match SF Symbols' stroke weight / optical scale and named after the
  corresponding SF Symbol so they align with adjacent text. The real SF Symbols
  font is NOT embedded (licensed to Apple platforms).
*/

export type IconName =
  | 'house'
  | 'house.fill'
  | 'magnifyingglass'
  | 'cart'
  | 'cart.fill'
  | 'bag'
  | 'bag.fill'
  | 'star.fill'
  | 'chevron.right'
  | 'chevron.left'
  | 'chevron.down'
  | 'xmark.circle.fill'
  | 'xmark'
  | 'plus'
  | 'minus'
  | 'checkmark'
  | 'checkmark.circle.fill'
  | 'shippingbox.fill'
  | 'exclamationmark.triangle.fill'
  | 'exclamationmark.circle.fill'
  | 'sun.max.fill'
  | 'moon.fill'
  | 'arrow.up.arrow.down'
  | 'line.3.horizontal.decrease'
  | 'bolt.fill'
  | 'truck.box.fill'
  | 'trash'

type Props = SVGProps<SVGSVGElement> & {
  name: IconName
  size?: number
  /** SF Symbols scales roughly to text weight; default matches Body/Semibold. */
  weight?: number
  title?: string
}

const strokePaths: Partial<Record<IconName, ReactElement>> = {
  house: (
    <path d="M3 10.5 12 4l9 6.5M5 9.5V20h5v-6h4v6h5V9.5" />
  ),
  magnifyingglass: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  cart: (
    <>
      <path d="M3 4h2l2.2 11.2a1.5 1.5 0 0 0 1.5 1.2h8.1a1.5 1.5 0 0 0 1.5-1.2L20.5 8H6.2" />
      <circle cx="9" cy="20" r="1.3" />
      <circle cx="18" cy="20" r="1.3" />
    </>
  ),
  bag: (
    <path d="M6 8h12l-.8 12.2a1.5 1.5 0 0 1-1.5 1.3H8.3a1.5 1.5 0 0 1-1.5-1.3L6 8Zm3 0V6.5a3 3 0 0 1 6 0V8" />
  ),
  'chevron.right': <path d="m9 5 7 7-7 7" />,
  'chevron.left': <path d="m15 5-7 7 7 7" />,
  'chevron.down': <path d="m5 9 7 7 7-7" />,
  xmark: <path d="M6 6l12 12M18 6 6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  checkmark: <path d="m4 12.5 5 5L20 6" />,
  trash: (
    <path d="M4 7h16M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7m2 0-.8 12.2a1.5 1.5 0 0 1-1.5 1.3H9.3a1.5 1.5 0 0 1-1.5-1.3L7 7" />
  ),
  'arrow.up.arrow.down': (
    <path d="M7 4v16m0-16L4 7m3-3 3 3M17 20V4m0 16 3-3m-3 3-3-3" />
  ),
  'line.3.horizontal.decrease': (
    <path d="M3 6h18M6 12h12M9 18h6" />
  ),
}

const solidPaths: Partial<Record<IconName, ReactElement>> = {
  'house.fill': (
    <path d="M11.3 3.3a1 1 0 0 1 1.4 0l8 7.2a1 1 0 0 1 .3.74V20a1 1 0 0 1-1 1h-4.5v-5.5a1 1 0 0 0-1-1h-3a1 1 0 0 0-1 1V21H4a1 1 0 0 1-1-1v-8.76a1 1 0 0 1 .3-.74Z" />
  ),
  'cart.fill': (
    <>
      <path d="M2.5 3.5a1 1 0 0 0 0 2h1.7l2.2 10.7a2 2 0 0 0 2 1.6h9.1a1 1 0 0 0 0-2H8.4l-.3-1.4h9.5a2 2 0 0 0 2-1.6l1.3-6a1 1 0 0 0-1-1.2H6.1l-.3-1.5a1 1 0 0 0-1-.8Z" />
      <circle cx="9" cy="20.5" r="1.6" />
      <circle cx="18" cy="20.5" r="1.6" />
    </>
  ),
  'bag.fill': (
    <path d="M8 6.5a4 4 0 0 1 8 0V7h1.7a1.5 1.5 0 0 1 1.5 1.4l.75 11.2a1.8 1.8 0 0 1-1.8 1.9H6.85a1.8 1.8 0 0 1-1.8-1.9L5.8 8.4A1.5 1.5 0 0 1 7.3 7H8Zm1.6.5h4.8v-.5a2.4 2.4 0 0 0-4.8 0Z" />
  ),
  'star.fill': (
    <path d="M12 3.2l2.5 5.6 6.1.6-4.6 4 1.4 6-5.4-3.2L6.6 19.4 8 13.4l-4.6-4 6.1-.6Z" />
  ),
  'xmark.circle.fill': (
    <>
      <circle cx="12" cy="12" r="9.5" stroke="none" />
      <path d="M8.8 8.8 15.2 15.2M15.2 8.8 8.8 15.2" stroke="var(--bg)" strokeWidth={2} fill="none" />
    </>
  ),
  'checkmark.circle.fill': (
    <>
      <circle cx="12" cy="12" r="9.5" stroke="none" />
      <path d="m7.8 12.4 2.9 2.9 5.5-6" stroke="#fff" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  'shippingbox.fill': (
    <path d="M3.5 7.2 12 3l8.5 4.2v9.6L12 21l-8.5-4.2Zm8.5.3 4.2-2M12 7.5v13" strokeWidth={0} />
  ),
  'truck.box.fill': (
    <path d="M2.5 6.5A1.5 1.5 0 0 1 4 5h9a1.5 1.5 0 0 1 1.5 1.5V8H17l3 3v5a1 1 0 0 1-1 1h-1a2 2 0 1 1-4 0H9a2 2 0 1 1-4 0H4a1.5 1.5 0 0 1-1.5-1.5Z" />
  ),
  'exclamationmark.triangle.fill': (
    <path d="M10.7 3.9 2.4 18a1.5 1.5 0 0 0 1.3 2.3h16.6a1.5 1.5 0 0 0 1.3-2.3L13.3 3.9a1.5 1.5 0 0 0-2.6 0ZM12 8.5v5m0 3.2h.01" strokeWidth={0} />
  ),
  'exclamationmark.circle.fill': (
    <>
      <circle cx="12" cy="12" r="9.5" stroke="none" />
      <path d="M12 7v6.2M12 16.4h.01" stroke="var(--bg)" strokeWidth={2} strokeLinecap="round" fill="none" />
    </>
  ),
  'sun.max.fill': (
    <>
      <circle cx="12" cy="12" r="4.2" stroke="none" />
      <path d="M12 2.5v2.2M12 19.3v2.2M4.4 4.4l1.6 1.6M18 18l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.4 19.6 6 18M18 6l1.6-1.6" strokeWidth={1.8} strokeLinecap="round" />
    </>
  ),
  'moon.fill': (
    <path d="M20 14.2A8 8 0 1 1 9.8 4 6.5 6.5 0 0 0 20 14.2Z" stroke="none" />
  ),
  'bolt.fill': (
    <path d="M13 2 4 13h6l-1 9 9-11h-6Z" stroke="none" />
  ),
}

export function Icon({ name, size = 20, weight = 1.8, title, ...rest }: Props) {
  const solid = solidPaths[name]
  const stroke = strokePaths[name]
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={solid ? 'currentColor' : 'none'}
      stroke={solid ? 'none' : 'currentColor'}
      strokeWidth={weight}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {solid ?? stroke}
    </svg>
  )
}
