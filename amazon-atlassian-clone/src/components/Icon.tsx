// ADS line-icon set: 1.5px stroke, rounded outer corners, square terminals,
// single-color (inherits currentColor via tokenized text color). No multi-color / emoji.
import type { ReactNode, SVGProps } from 'react'

export type IconName =
  | 'search'
  | 'cart'
  | 'star'
  | 'star-half'
  | 'chevron-down'
  | 'chevron-up'
  | 'chevron-right'
  | 'chevron-left'
  | 'check'
  | 'plus'
  | 'minus'
  | 'close'
  | 'sun'
  | 'moon'
  | 'monitor'
  | 'home'
  | 'grid'
  | 'truck'
  | 'box'
  | 'info'
  | 'warning'
  | 'error'
  | 'tag'
  | 'menu'
  | 'sort'

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName
  size?: number
  label?: string
}

const paths: Record<IconName, ReactNode> = {
  search: (
    <>
      <circle cx="7" cy="7" r="5" />
      <line x1="11" y1="11" x2="14.5" y2="14.5" />
    </>
  ),
  cart: (
    <>
      <path d="M1.5 1.5h2l1.2 8.2a1 1 0 0 0 1 .85h6.1a1 1 0 0 0 1-.8l1-5.25H4" />
      <circle cx="6.5" cy="14" r="0.6" />
      <circle cx="12.5" cy="14" r="0.6" />
    </>
  ),
  star: <path d="M8 1.6l1.9 3.85 4.25.62-3.08 3 .73 4.23L8 11.3l-3.8 2 .73-4.23-3.08-3 4.25-.62z" />,
  'star-half': (
    <>
      <path d="M8 1.6l1.9 3.85 4.25.62-3.08 3 .73 4.23L8 11.3l-3.8 2 .73-4.23-3.08-3 4.25-.62z" />
      <path d="M8 1.6v9.7l-3.8 2 .73-4.23-3.08-3 4.25-.62z" fill="currentColor" stroke="none" />
    </>
  ),
  'chevron-down': <path d="M3.5 6l4.5 4.5L12.5 6" />,
  'chevron-up': <path d="M3.5 10l4.5-4.5L12.5 10" />,
  'chevron-right': <path d="M6 3.5L10.5 8 6 12.5" />,
  'chevron-left': <path d="M10 3.5L5.5 8 10 12.5" />,
  check: <path d="M3 8.2l3.2 3.3L13 4.5" />,
  plus: (
    <>
      <line x1="8" y1="3" x2="8" y2="13" />
      <line x1="3" y1="8" x2="13" y2="8" />
    </>
  ),
  minus: <line x1="3" y1="8" x2="13" y2="8" />,
  close: (
    <>
      <line x1="4" y1="4" x2="12" y2="12" />
      <line x1="12" y1="4" x2="4" y2="12" />
    </>
  ),
  sun: (
    <>
      <circle cx="8" cy="8" r="3" />
      <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3 3l1 1M12 12l1 1M13 3l-1 1M4 12l-1 1" />
    </>
  ),
  moon: <path d="M13 9.5A5.5 5.5 0 0 1 6.5 3a5.5 5.5 0 1 0 6.5 6.5z" />,
  monitor: (
    <>
      <rect x="1.75" y="2.5" width="12.5" height="8.5" rx="1" />
      <line x1="5.5" y1="14" x2="10.5" y2="14" />
      <line x1="8" y1="11" x2="8" y2="14" />
    </>
  ),
  home: <path d="M2.5 7L8 2.5 13.5 7v6.5a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5z" />,
  grid: (
    <>
      <rect x="2" y="2" width="5" height="5" rx="0.8" />
      <rect x="9" y="2" width="5" height="5" rx="0.8" />
      <rect x="2" y="9" width="5" height="5" rx="0.8" />
      <rect x="9" y="9" width="5" height="5" rx="0.8" />
    </>
  ),
  truck: (
    <>
      <path d="M1.5 3.5h8v7h-8z" />
      <path d="M9.5 6h3l2 2.5v2h-5z" />
      <circle cx="4.5" cy="12" r="1.2" />
      <circle cx="11.5" cy="12" r="1.2" />
    </>
  ),
  box: (
    <>
      <path d="M8 1.8l6 3v6.4l-6 3-6-3V4.8z" />
      <path d="M2 4.8l6 3 6-3M8 7.8v6.4" />
    </>
  ),
  info: (
    <>
      <circle cx="8" cy="8" r="6.2" />
      <line x1="8" y1="7" x2="8" y2="11.5" />
      <line x1="8" y1="4.6" x2="8" y2="4.7" />
    </>
  ),
  warning: (
    <>
      <path d="M8 1.8l6.4 11.2H1.6z" />
      <line x1="8" y1="6" x2="8" y2="9.5" />
      <line x1="8" y1="11.2" x2="8" y2="11.3" />
    </>
  ),
  error: (
    <>
      <circle cx="8" cy="8" r="6.2" />
      <line x1="5.5" y1="5.5" x2="10.5" y2="10.5" />
      <line x1="10.5" y1="5.5" x2="5.5" y2="10.5" />
    </>
  ),
  tag: (
    <>
      <path d="M7.5 1.8H13a1 1 0 0 1 1 1v5.5L7.8 14.5a1 1 0 0 1-1.4 0L1.9 10a1 1 0 0 1 0-1.4z" />
      <circle cx="10.8" cy="5.2" r="0.7" />
    </>
  ),
  menu: (
    <>
      <line x1="2" y1="4" x2="14" y2="4" />
      <line x1="2" y1="8" x2="14" y2="8" />
      <line x1="2" y1="12" x2="14" y2="12" />
    </>
  ),
  sort: <path d="M8 3v10M8 3L5 6M8 3l3 3" />,
}

export function Icon({ name, size = 16, label, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="square"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      {...rest}
    >
      {paths[name]}
    </svg>
  )
}
