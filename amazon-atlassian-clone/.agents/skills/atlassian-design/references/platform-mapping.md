# Atlassian Design System — Platform Mapping

## 1. HTML / CSS / WEB

Load the actual Atlassian font assets with `@font-face` or the framework's local-font loader. Use CSS custom properties, `rem` for type, `px` for spacing/borders. Dark/light via `prefers-color-scheme` or class toggle.

```css
@font-face {
  font-family: "Atlassian Sans";
  src: url("/fonts/AtlassianSans-Bold.ttf") format("truetype");
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: "Atlassian Sans";
  src: url("/fonts/AtlassianSans-Regular.ttf") format("truetype");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
```

```css
:root {
  --black: #1F1F21;
  --surface: #242528;
  --surface-raised: #2B2C2F;
  --border: #E3E4F21F;
  --border-visible: #7E8188;
  --text-disabled: #E5E9F640;
  --text-secondary: #A9ABAF;
  --text-primary: #CECFD2;
  --text-display: #FFFFFF;
  --accent: #1868DB;
  --accent-subtle: #E9F2FE;
  --success: #5B7F24;
  --warning: #FBC828;
  --interactive: #669DF1;
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  --space-3xl: 64px;
  --space-4xl: 80px;

  /* elevation shadows (dark retains shadows too) */
  --elevation-shadow-raised: 0px 1px 1px rgba(3, 4, 4, 0.5), 0px 0px 1px rgba(3, 4, 4, 0.5);
  --elevation-shadow-overlay: 0px 8px 12px rgba(3, 4, 4, 0.36), 0px 0px 1px rgba(3, 4, 4, 0.5);

  /* motion */
  --ease-out-bold: cubic-bezier(0, 0.4, 0, 1);
  --ease-in-out-bold: cubic-bezier(0.4, 0, 0, 1);
  --ease-in-practical: cubic-bezier(0.6, 0, 0.8, 0.6);
  --ease-out-practical: cubic-bezier(0.4, 1, 0.6, 1);
  --duration-fast: 100ms;
  --duration-medium: 250ms;
}
```

The block above is the dark theme (default here). Map the same variable names to light values with a `[data-theme="light"]` selector (or `prefers-color-scheme`):

```css
[data-theme="light"] {
  --black: #F8F8F8;            /* page (elevation.surface.sunken) */
  --surface: #FFFFFF;          /* elevation.surface */
  --surface-raised: #FFFFFF;   /* elevation.surface.raised */
  --border: #0B120E24;         /* color.border (14% alpha) */
  --border-visible: #7D818A;   /* color.border.bold */
  --text-disabled: #080F214A;  /* color.text.disabled */
  --text-secondary: #505258;   /* color.text.subtle */
  --text-primary: #292A2E;     /* color.text */
  --text-display: #1E1F21;
  --accent: #1868DB;           /* color.background.brand.bold */
  --accent-subtle: #E9F2FE;    /* color.background.selected */
  --success: #5B7F24;
  --warning: #FBC828;
  --interactive: #1868DB;      /* color.link */
  --elevation-shadow-raised: 0px 1px 1px rgba(30, 31, 33, 0.25), 0px 0px 1px rgba(30, 31, 33, 0.31);
  --elevation-shadow-overlay: 0px 8px 12px rgba(30, 31, 33, 0.15), 0px 0px 1px rgba(30, 31, 33, 0.31);
}

/* Reduced motion: make transitions instant */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**In production prefer the official `@atlaskit/tokens` package** (`import '@atlaskit/tokens/css-reset'` + `setGlobalTheme`) or the `token()` function over the hardcoded hex values above — tokens composite alpha correctly and theme automatically.

---

## 2. SWIFTUI / iOS

Register fonts in Info.plist, bundle licensed `.ttf` files. Use `@Environment(\.colorScheme)` for mode switching.

```swift
extension Color {
    static let adsSurface = Color(hex: "1F1F21")        // elevation.surface (dark)
    static let adsSurfaceRaised = Color(hex: "242528")  // elevation.surface.raised
    static let adsSurfaceOverlay = Color(hex: "2B2C2F") // elevation.surface.overlay
    static let adsBorder = Color(hex: "44464B")         // color.border
    static let adsBorderBold = Color(hex: "7E8188")     // color.border.bold
    static let adsTextDisabled = Color(hex: "5A5D63")   // color.text.disabled
    static let adsTextSubtle = Color(hex: "A9ABAF")     // color.text.subtle
    static let adsText = Color(hex: "CECFD2")           // color.text
    static let adsTextInverse = Color.white
    static let adsBrand = Color(hex: "669DF1")          // color.background.brand.bold
    static let adsSuccess = Color(hex: "94C748")        // color.background.success.bold
    static let adsWarning = Color(hex: "FBC828")        // color.background.warning.bold
    static let adsLink = Color(hex: "669DF1")           // color.link
}
```

Light mode values in tokens.md Dark/Light table. Derive the Font extension from the font stack table (e.g. `.custom("Atlassian Sans", size:)`, weight `.bold` for display; `Atlassian Mono` for code). In production prefer the official `@atlaskit/tokens` package over hardcoded hex.

---

## 3. REACT / @atlaskit (RECOMMENDED FOR PRODUCT UI)

The most faithful output is the real component library — it ships the tokens, a11y, and interaction states for free.

```tsx
import { setGlobalTheme, token } from '@atlaskit/tokens';
import Button from '@atlaskit/button/new';
import Lozenge from '@atlaskit/lozenge';
import '@atlaskit/css-reset';

// Theme once at app root. 'auto' follows the OS setting.
setGlobalTheme({ colorMode: 'auto', light: 'light', dark: 'dark' });

<Button appearance="primary">Create</Button>
<Lozenge appearance="inprogress">In progress</Lozenge>

// Reach for token() instead of hex when writing custom styles:
const styles = {
  background: token('elevation.surface.raised'),
  color: token('color.text'),
  boxShadow: token('elevation.shadow.raised'),
  borderRadius: token('border.radius', '8px'),
  padding: token('space.200'),
};
```

Use `@atlaskit/primitives` (`Box`, `Inline`, `Stack`, `Grid`, `Flex`) for layout so spacing comes from `space.*` tokens, and `@atlaskit/icon` for icons. Prefer `appearance`/`spacing` props over custom CSS.

### Tailwind mapping (when @atlaskit isn't an option)

Mirror the tokens in `tailwind.config` so utilities stay on-system. Drive dark mode with `darkMode: 'class'` (or `'media'`) and CSS variables (from §1) so one config themes both modes:

```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      surface: 'var(--surface)', 'surface-raised': 'var(--surface-raised)',
      ink: 'var(--text-primary)', subtle: 'var(--text-secondary)',
      brand: 'var(--accent)', danger: '#C9372C', success: 'var(--success)',
      warning: 'var(--warning)', border: 'var(--border-visible)',
    },
    borderRadius: { sm: '4px', DEFAULT: '6px', lg: '8px', xl: '12px', full: '999px' },
    spacing: { 0.5: '2px', 1: '4px', 2: '8px', 3: '12px', 4: '16px', 5: '20px', 6: '24px', 8: '32px', 10: '40px', 12: '48px', 16: '64px', 20: '80px' },
    fontFamily: { sans: ['"Atlassian Sans"', 'system-ui', 'sans-serif'], mono: ['"Atlassian Mono"', 'ui-monospace', 'monospace'] },
  },
}
```

`<button class="bg-brand text-white rounded px-3 h-8 font-medium">Create</button>` → primary button. Keep the strong brand color to roughly one primary action per view.

---

## 4. FIGMA (DESIGN TOOL)

Design with the official Atlassian Design System Figma libraries and the ADS Figma plugin so components, color/space tokens, and text styles stay in sync with code. Use `Atlassian Sans` (and `Atlassian Mono` for code) — verify the font is installed before styling. Apply **typography tokens / text styles** (`font.heading.*`, `font.body*`, `font.metric.*`, `font.code`) rather than manual size/weight, and use color + space tokens rather than raw hex. Provide light and dark themes via the plugin's theme switch rather than duplicating frames by hand.

---

## 5. WORKED EXAMPLE — DASHBOARD CARD (HTML/CSS, tokens)

A raised metric card that follows the rules: one heavy metric, sentence-case label, semantic status Lozenge, 8px rhythm, paired surface+shadow.

```html
<article class="card">
  <p class="card__label">Open incidents</p>
  <p class="card__metric">1,284</p>
  <span class="lozenge lozenge--danger">OVER SLA</span>
</article>
```

```css
.card {
  background: var(--surface-raised);
  box-shadow: var(--elevation-shadow-raised);
  border-radius: 8px;               /* radius.large */
  padding: 16px;                    /* space.200 */
  display: flex; flex-direction: column; gap: 8px; /* space.100 */
  font-family: "Atlassian Sans", system-ui, sans-serif;
}
.card__label  { font-size: 12px; color: var(--text-secondary); margin: 0; } /* body.small, sentence case */
.card__metric { font-size: 28px; line-height: 32px; font-weight: 700; color: var(--text-display); margin: 0; } /* metric.large */
.lozenge--danger {
  align-self: start; text-transform: uppercase; font-size: 11px; font-weight: 700;
  padding: 2px 6px; border-radius: 4px;      /* radius.small */
  background: #FFECEB; color: #AE2E24;       /* danger subtle / text.danger (light) */
}
@media (prefers-reduced-motion: no-preference) {
  .card { transition: box-shadow 100ms var(--ease-out-practical); }
}
```
