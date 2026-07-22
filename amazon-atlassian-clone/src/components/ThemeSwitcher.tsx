import { useTheme, type ThemeChoice } from '../context/ThemeContext'
import { SegmentedControl } from './SegmentedControl'
import { Icon } from './Icon'

// Light / auto / dark switch. Defaults to `auto` (follows the OS setting).
export function ThemeSwitcher() {
  const { choice, setChoice } = useTheme()
  return (
    <SegmentedControl<ThemeChoice>
      ariaLabel="Color theme"
      value={choice}
      onChange={setChoice}
      segments={[
        { value: 'light', label: <Icon name="sun" size={16} label="Light theme" />, ariaLabel: 'Light theme' },
        {
          value: 'auto',
          label: <Icon name="monitor" size={16} label="System theme" />,
          ariaLabel: 'System theme',
        },
        { value: 'dark', label: <Icon name="moon" size={16} label="Dark theme" />, ariaLabel: 'Dark theme' },
      ]}
    />
  )
}
