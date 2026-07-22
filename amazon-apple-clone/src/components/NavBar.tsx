import { useNavigate } from 'react-router-dom'
import { Icon } from './Icon'
import { useTheme, type Appearance } from '../state/ThemeContext'

/*
  Navigation bar on the material (functional/floating layer). Large title that
  reads like a nav bar (Title Case). Optional back chevron in tint. An
  appearance toggle sits as a trailing toolbar action.
*/
export function NavBar({
  title,
  back,
  large = true,
}: {
  title: string
  back?: { label: string; to: number | string }
  large?: boolean
}) {
  const navigate = useNavigate()
  return (
    <header className="material sticky top-0 z-40 hairline-b">
      <div className="mx-auto max-w-[1100px] px-md">
        <div className="flex h-[52px] items-center justify-between">
          {back ? (
            <button
              className="press -ml-sm flex min-h-[44px] items-center gap-[2px] pr-sm text-body text-tint"
              onClick={() =>
                typeof back.to === 'number'
                  ? navigate(back.to)
                  : navigate(back.to)
              }
            >
              <Icon name="chevron.left" size={20} weight={2.4} />
              {back.label}
            </button>
          ) : (
            <span className="text-headline font-semibold">Storefront</span>
          )}
          {!large && !back ? (
            <span className="text-headline font-semibold">{title}</span>
          ) : (
            <span />
          )}
          <AppearanceToggle />
        </div>
        {large ? (
          <h1 className="pb-sm pt-xs text-large-title font-bold tracking-tight">
            {title}
          </h1>
        ) : null}
      </div>
    </header>
  )
}

const order: Appearance[] = ['system', 'light', 'dark']

function AppearanceToggle() {
  const { appearance, resolved, setAppearance } = useTheme()
  const next = order[(order.indexOf(appearance) + 1) % order.length]
  const iconName = resolved === 'dark' ? 'moon.fill' : 'sun.max.fill'
  return (
    <button
      className="press flex h-[44px] w-[44px] items-center justify-center text-tint"
      onClick={() => setAppearance(next)}
      aria-label={`Appearance: ${appearance}. Switch to ${next}.`}
      title={`Appearance: ${appearance}`}
    >
      <Icon name={iconName} size={20} />
    </button>
  )
}
