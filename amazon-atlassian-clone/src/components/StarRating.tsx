import { Icon } from './Icon'

// Rating shown with icon + text (never color alone). Stars use the warning/yellow accent.
interface StarRatingProps {
  rating: number
  count?: number
  size?: number
}

export function StarRating({ rating, count, size = 14 }: StarRatingProps) {
  const rounded = Math.round(rating * 2) / 2
  return (
    <span className="inline-flex items-center gap-1" aria-label={`Rated ${rating} out of 5`}>
      <span className="inline-flex text-warning-bold" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => {
          const filled = i + 1 <= rounded
          const half = !filled && i + 0.5 === rounded
          return (
            <Icon
              key={i}
              name={half ? 'star-half' : 'star'}
              size={size}
              className={filled || half ? '' : 'text-[color:var(--border-visible)]'}
            />
          )
        })}
      </span>
      <span className="text-caption font-medium text-ink">{rating.toFixed(1)}</span>
      {count !== undefined && <span className="text-caption text-subtle">({count.toLocaleString()})</span>}
    </span>
  )
}
