/** @type {import('tailwindcss').Config} */
// Tokens mirror .agents/skills/atlassian-design/references (tokens.md + platform-mapping.md §3).
// One CSS-variable set (defined in src/index.css) themes both dark and light modes.
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        page: 'var(--black)',
        surface: 'var(--surface)',
        'surface-sunken': 'var(--surface-sunken)',
        'surface-raised': 'var(--surface-raised)',
        'surface-overlay': 'var(--surface-overlay)',
        ink: 'var(--text-primary)',
        display: 'var(--text-display)',
        subtle: 'var(--text-secondary)',
        disabled: 'var(--text-disabled)',
        brand: 'var(--accent)',
        'brand-subtle': 'var(--accent-subtle)',
        selected: 'var(--text-selected)',
        link: 'var(--interactive)',
        inverse: 'var(--inverse)',
        'border-subtle': 'var(--border)',
        'border-bold': 'var(--border-visible)',
        focused: 'var(--border-focused)',
        'success-bold': 'var(--success-bold)',
        'warning-bold': 'var(--warning-bold)',
        'danger-bold': 'var(--danger-bold)',
      },
      borderRadius: {
        // radius mapping per SKILL anti-patterns + tokens.md §7
        sm: '4px', // tags / lozenges (radius.small)
        DEFAULT: '6px', // buttons / inputs (radius.medium)
        lg: '8px', // cards / menus (radius.large)
        xl: '12px', // modals / tables (radius.xlarge)
        full: '999px', // avatars / progress track
      },
      spacing: {
        // 8px rhythm (tokens.md §3)
        0.5: '2px',
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        8: '32px',
        10: '40px',
        12: '48px',
        16: '64px',
        20: '80px',
      },
      fontFamily: {
        sans: [
          '"Atlassian Sans"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        mono: ['"Atlassian Mono"', 'ui-monospace', '"SFMono-Regular"', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        // type scale (tokens.md §1)
        label: ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.02em' }], // 11px
        caption: ['0.75rem', { lineHeight: '1rem' }], // 12px
        body: ['0.875rem', { lineHeight: '1.25rem' }], // 14px
        subheading: ['1rem', { lineHeight: '1.25rem' }], // 16px
        heading: ['1.25rem', { lineHeight: '1.5rem' }], // 20px
        'display-md': ['1.5rem', { lineHeight: '1.75rem', letterSpacing: '-0.005em' }], // 24px
        'display-lg': ['1.75rem', { lineHeight: '2rem', letterSpacing: '-0.01em' }], // 28px metric.large
        'display-xl': ['2rem', { lineHeight: '2.25rem', letterSpacing: '-0.01em' }], // 32px
        'metric-hero': ['2.75rem', { lineHeight: '3rem', letterSpacing: '-0.02em' }], // hero price
      },
      boxShadow: {
        raised: 'var(--elevation-shadow-raised)',
        overlay: 'var(--elevation-shadow-overlay)',
      },
      transitionDuration: {
        250: '250ms',
      },
      transitionTimingFunction: {
        'out-bold': 'cubic-bezier(0, 0.4, 0, 1)',
        'in-out-bold': 'cubic-bezier(0.4, 0, 0, 1)',
        'in-practical': 'cubic-bezier(0.6, 0, 0.8, 0.6)',
        'out-practical': 'cubic-bezier(0.4, 1, 0.6, 1)',
      },
    },
  },
  plugins: [],
}
