/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Semantic, appearance-adaptive colors wired through CSS custom properties.
      // One variable set themes both light and dark (see index.css).
      colors: {
        label: 'var(--label)',
        'label-secondary': 'var(--label-secondary)',
        'label-tertiary': 'var(--label-tertiary)',
        placeholder: 'var(--placeholder)',
        bg: 'var(--bg)',
        'bg-secondary': 'var(--bg-secondary)',
        grouped: 'var(--bg-grouped)',
        'grouped-secondary': 'var(--bg-grouped-secondary)',
        'grouped-tertiary': 'var(--bg-grouped-tertiary)',
        separator: 'var(--separator)',
        'fill-secondary': 'var(--fill-secondary)',
        'fill-tertiary': 'var(--fill-tertiary)',
        tint: 'var(--tint)',
        red: 'var(--red)',
        green: 'var(--green)',
        orange: 'var(--orange)',
        yellow: 'var(--yellow)',
      },
      fontFamily: {
        ui: 'var(--font-ui)',
        serif: 'var(--font-serif)',
        mono: 'var(--font-mono)',
      },
      // Dynamic Type text styles (Large default sizes) — size / leading pairs.
      fontSize: {
        'large-title': ['34px', { lineHeight: '41px', letterSpacing: '0.37px' }],
        'title-1': ['28px', { lineHeight: '34px', letterSpacing: '0.36px' }],
        'title-2': ['22px', { lineHeight: '28px', letterSpacing: '0.35px' }],
        'title-3': ['20px', { lineHeight: '25px', letterSpacing: '0.38px' }],
        headline: ['17px', { lineHeight: '22px', letterSpacing: '-0.43px' }],
        body: ['17px', { lineHeight: '22px', letterSpacing: '-0.43px' }],
        callout: ['16px', { lineHeight: '21px', letterSpacing: '-0.32px' }],
        subheadline: ['15px', { lineHeight: '20px', letterSpacing: '-0.24px' }],
        footnote: ['13px', { lineHeight: '18px', letterSpacing: '-0.08px' }],
        'caption-1': ['12px', { lineHeight: '16px' }],
        'caption-2': ['11px', { lineHeight: '13px' }],
      },
      // 8pt soft grid.
      spacing: {
        '2xs': '2px',
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '20px',
        xl: '24px',
        '2xl': '32px',
        '3xl': '44px',
        tap: '44px',
      },
      borderRadius: {
        control: '10px',
        card: '12px',
        sheet: '14px',
      },
    },
  },
  plugins: [],
}
