# Atlassian Design System — Tokens

## 1. TYPOGRAPHY

### Font Stack

| Role | Font | Fallback | Weight |
|------|------|----------|--------|
| **Display** | `"Atlassian Sans"` | `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` | 700 |
| **Body / UI** | `"Atlassian Sans"` | -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif | 400 |
| **Metric / Numbers** | `"Atlassian Sans"` | `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` | 700 |
| **Code / Mono** | `"Atlassian Mono"` | `ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace` | 400 |

**Why these fonts:** `Atlassian Sans` is the Atlassian in-product UI typeface and `Atlassian Mono` is the in-product monospace face for code. (`Charlie Sans` is Atlassian's brand/marketing font and is **not** used for product UI.) These are licensed Atlassian fonts; if the project does not have them, fall back to the modernized system-font stacks above rather than substituting Google Fonts.

### Loading Requirements

- Atlassian Sans / Atlassian Mono are licensed Atlassian fonts. Verify the project has authorized copies before shipping final UI.
- Do not bundle, publish, or copy the font files into public outputs unless redistribution rights are explicitly confirmed.
- If the real fonts are unavailable, use the system-font fallback stacks — the type scale and tokens below are what carry the Atlassian feel, and the layout stays correct on fallbacks.

### Type Scale

| Token | Size | Line Height | Letter Spacing | Use |
|-------|------|-------------|----------------|-----|
| `--display-xl` | 32px | 36px | -0.01em | Hero numbers, time displays |
| `--display-lg` | 28px | 32px | -0.01em | Section heroes, percentages |
| `--display-md` | 24px | 28px | -0.005em | Page titles |
| `--heading` | 20px | 24px | 0 | Section headings |
| `--subheading` | 16px | 20px | 0 | Subsections |
| `--body` | 14px | 20px | 0 | Body text |
| `--body-sm` | 12px | 16px | 0 | Secondary body |
| `--caption` | 12px | 16px | 0 | Timestamps, footnotes |
| `--label` | 11px | 16px | 0.02em | Small labels / overlines. Sentence case; UPPERCASE reserved for Lozenges |

### Typographic Rules

- **Display / headings:** Atlassian Sans Bold (`font.heading.*`). Use heading levels in descending order; one h1 per page, never skip a level.
- **Body:** Atlassian Sans Regular (`font.body`, 14px default). Medium weight when aligned beside line icons; Bold sparingly for emphasis.
- **Labels:** Atlassian Sans, **sentence case** (ADS content style). UPPERCASE is reserved for Lozenges. Field labels sit above inputs.
- **Metrics / numbers:** Atlassian Sans Bold via `font.metric.*` (28/24/16px). Use `Atlassian Mono` only for code (`font.code`, 12px).
- **Units in rem:** typography tokens use `rem` (1rem = 16px) so users can scale text; keep px values here as reference only.

---

## 2. COLOR SYSTEM

### Primary Palette (Dark Mode)

| Token | Hex | Contrast on #1F1F21 | Role |
|-------|-----|-------------------|------|
| `--black` | `#1F1F21` | — | Primary background (elevation.surface) |
| `--surface` | `#242528` | 1.07:1 | Elevated surfaces, cards |
| `--surface-raised` | `#2B2C2F` | 1.18:1 | Secondary elevation |
| `--border` | `#E3E4F21F` | — | Subtle dividers (decorative only) |
| `--border-visible` | `#7E8188` | — | Intentional borders, wireframe lines |
| `--text-disabled` | `#E5E9F640` | ~2.4:1 | Disabled text, decorative elements |
| `--text-secondary` | `#A9ABAF` | 7.1:1 | Labels, captions, metadata |
| `--text-primary` | `#CECFD2` | 10.6:1 | Body text |
| `--text-display` | `#FFFFFF` | 16.5:1 | Headlines, hero numbers |

### Accent & Status Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--accent` | `#1868DB` | Brand blue (`color.background.brand.bold`): primary action / current selection. Typically one primary per view. Never decorative. |
| `--accent-subtle` | `#E9F2FE` | Selected/brand tint backgrounds (`color.background.selected`) |
| `--success` | `#5B7F24` | Confirmed, completed, connected (green) |
| `--warning` | `#FBC828` | Caution, pending, degraded (yellow) |
| `--error` | `#C9372C` | Danger red (`color.background.danger.bold`) — destructive / error states |
| `--info` | `#1868DB` | Informative / in-progress (information blue) |
| `--discovery` | `#964AC0` | New features, onboarding, AI moments (purple) |
| `--interactive` | `#1868DB` / `#669DF1` | Tappable text: links, picker values. Not for buttons. |

**Data status colors:** `--success` = good/in range, `--warning` = moderate/attention, `--error` (danger red) = bad/over limit, `--text-primary` = neutral. Apply color to the **value / status element** (a Lozenge, a metric), not the label or the row background. Labels stay `--text-secondary`. Trend arrows inherit value color.

### Dark / Light Mode

| Token | Dark | Light |
|-------|------|-------|
| `--black` | `#1F1F21` | `#F8F8F8` |
| `--surface` | `#242528` | `#FFFFFF` |
| `--surface-raised` | `#2B2C2F` | `#FFFFFF` |
| `--border` | `#E3E4F21F` | `#0B120E24` |
| `--border-visible` | `#7E8188` | `#7D818A` |
| `--text-disabled` | `#E5E9F640` | `#080F214A` |
| `--text-secondary` | `#A9ABAF` | `#505258` |
| `--text-primary` | `#CECFD2` | `#292A2E` |
| `--text-display` | `#FFFFFF` | `#1E1F21` |
| `--interactive` | `#669DF1` | `#1868DB` |

**Identical across modes:** Brand blue, semantic status colors, sentence-case labels, fonts, type scale, spacing, component shapes.

**Dark feel:** Product UI at night: near-black neutral surfaces (#1F1F21) that lighten as they elevate (raised #242528, overlay #2B2C2F), with brand blue and semantic colors shifted lighter for contrast.
**Light feel:** Clean product UI: white surfaces (#FFFFFF) on a soft neutral page (#F8F8F8); sunken wells group content and raised cards (paired with a shadow token) create gentle depth.

---

## 3. SPACING

### Spacing Scale (8px base)

| Token | Value | Use |
|-------|-------|-----|
| `--space-2xs` | 2px | Optical adjustments only |
| `--space-xs` | 4px | Icon-to-label gaps, tight padding |
| `--space-sm` | 8px | Component internal spacing |
| `--space-md` | 16px | Standard padding, element gaps |
| `--space-lg` | 24px | Group separation |
| `--space-xl` | 32px | Section margins |
| `--space-2xl` | 48px | Major section breaks |
| `--space-3xl` | 64px | Page-level vertical rhythm |
| `--space-4xl` | 80px | Hero breathing room |

---

## 4. MOTION & INTERACTION

> **Status:** ADS motion tokens are in **Early Access** (behind the `platform-dst-motion-uplift` feature flag) and cover a limited set of components. The durations/easing below reflect the published system; use plain CSS transitions with these values where the tokens aren't yet available.

- **Duration:** interactions 50–150ms (hover/press), transitions 150–400ms (enter/exit/move)
- **Easing tokens:**
  - `ease-out-bold: cubic-bezier(0, 0.4, 0, 1)` — entrances / expressive enter
  - `ease-in-out-bold: cubic-bezier(0.4, 0, 0, 1)` — moving or scaling elements
  - `ease-in-practical: cubic-bezier(0.6, 0, 0.8, 0.6)` — exits
  - `ease-out-practical: cubic-bezier(0.4, 1, 0.6, 1)` — everyday fades
  - No spring/bounce.
- **Principles:** human, clarity, accessible, performant. Use motion to clarify a change, guide attention, or give feedback.
- Animate scale, fade (opacity), slide (x/y), or color; make exits faster than entrances; use longer durations for larger elements. Avoid competing simultaneous animations.
- Hover/press use fast (<150ms) surface-color or elevation changes, not scale.
- **Reduced motion:** respect `prefers-reduced-motion` — make transitions instant or disable them. Never flash, rapidly oscillate, or use large sweeping motion.
- No parallax, scroll-jacking, gratuitous animation.

---

## 5. ICONOGRAPHY

- Line style, **1.5px stroke**. **Rounded outer corners, sharp inner corners, square terminals** (not fully round caps). 16×16px default; 12×12px small size for carefully limited use (chevrons, validation, compact rows).
- Use tokenized icon color (`color.icon`, `color.icon.subtle`) — icons inherit/track text color. Avoid diagonal 3D perspective; keep shapes simple and legible.
- Reuse existing icons and familiar, universal metaphors. Don't add an icon where text or a button is clearer.
- Preferred: `@atlaskit/icon` (Atlassian icons).

---

## 6. ELEVATION MOTIF

**When to use:** Raised cards (Jira/Trello cards), overlays (modals, dialogs, dropdown menus, floating toolbars), sunken wells (kanban columns), and scroll overflow shadows.

### CSS Implementation
```css
/* Pair each elevation.surface token with its matching elevation.shadow token */
:root {
  --elevation-surface: #FFFFFF;
  --elevation-surface-sunken: #F8F8F8;
  --elevation-surface-raised: #FFFFFF;
  --elevation-surface-overlay: #FFFFFF;
  --elevation-shadow-raised: 0px 1px 1px rgba(30, 31, 33, 0.25), 0px 0px 1px rgba(30, 31, 33, 0.31);
  --elevation-shadow-overlay: 0px 8px 12px rgba(30, 31, 33, 0.15), 0px 0px 1px rgba(30, 31, 33, 0.31);
}

.card--raised { background: var(--elevation-surface-raised); box-shadow: var(--elevation-shadow-raised); }
.overlay      { background: var(--elevation-surface-overlay); box-shadow: var(--elevation-shadow-overlay); }
.well--sunken { background: var(--elevation-surface-sunken); }
```

Always pair a surface token with its matching shadow token — never mix. In dark mode, surfaces also lighten as they rise (surface `#1F1F21` → raised `#242528` → overlay `#2B2C2F`) while retaining shadows for depth. Limit raised/overlay to intentional focal points; prefer a border or whitespace for grouping.

**`elevation.surface.sunken` vs `color.background.neutral`:** they look similar in light mode but differ in dark. `elevation.surface.sunken` is **opaque** and darkens in both modes — use it as a backdrop/well to group content (e.g. a kanban board) on the default surface. `color.background.neutral` is **transparent** and darkens in light mode but lightens in dark — use it for subtle element backgrounds (chips, hovered rows) that adapt to whatever sits behind them.

### Elevation levels

| Level | Token | Use |
|-------|-------|-----|
| Sunken | `elevation.surface.sunken` | Wells behind default surfaces (e.g. kanban columns). Only on default surfaces. |
| Default | `elevation.surface` | The standard content surface. |
| Raised | `elevation.surface.raised` + `elevation.shadow.raised` | Movable cards, limited emphasis. |
| Overlay | `elevation.surface.overlay` + `elevation.shadow.overlay` | Modals, dialogs, menus, floating toolbars, dragged UI. |
| Overflow | `elevation.shadow.overflow` | Cutoff shadow for clipped scrollable content — use a border first; reserve for when borders are insufficient. |

### Z-index scale

| z-index | Example |
|--------:|---------|
| 100 | (base) |
| 200 | Atlassian navigation |
| 300 | Inline dialog |
| 400 | Popup |
| 500 | Blanket |
| 510 | Modal |
| 600 | Flag |
| 700 | Spotlight |
| 800 | Tooltip |

---

## 7. SHAPE / RADIUS

| Token | Value | Suitable for |
|-------|-------|-----|
| `radius.xsmall` | 2px | Small detail elements: badges, checkboxes, avatar labels, keyboard shortcuts |
| `radius.small` | 4px | Supporting elements: labels, lozenges, tags, timestamps, dates, tooltip containers, imagery inside a table, compact buttons |
| `radius.medium` | 6px | **Interactive elements: buttons, inputs, text areas, selects, navigation items, smart links** |
| `radius.large` | 8px | Containment elements: cards, in-page containers, floating UI, dropdown menus |
| `radius.xlarge` | 12px | Large page elements: full-page containers, modals, kanban columns, tables |
| `radius.xxlarge` | 16px | Video player containers |
| `radius.full` | 999px | Circular / people-related: avatars, user UI, emoji reactions, pills |
| `radius.tile` | 25% | Tile component system only |

> Note the ADS mapping: interactive controls (buttons/inputs) use `radius.medium` (6px); cards/menus use `radius.large` (8px); modals/tables use `radius.xlarge` (12px). Pair radius tokens with **radius focus** tokens on the selected/active element.

Border widths: `border.width` 1px (default), `border.width.selected` 2px, `border.width.focused` 2px (focus ring).

---

## 8. SEMANTIC COLOR ROLES

ADS colors are chosen by **role → emphasis → interaction state**, never by raw hue. Roles:

| Role | Meaning |
|------|---------|
| `neutral` | Default text, surfaces, borders, non-semantic UI |
| `brand` | Atlassian brand blue — primary actions, selection |
| `information` | Neutral-informative messaging (blue) |
| `success` | Confirmed / completed (green) |
| `warning` | Caution / pending (yellow) |
| `danger` | Errors / destructive (red) |
| `discovery` | New features, onboarding, AI moments (purple) |
| `accent` | Decorative/expressive color — **only** where no semantic role applies |
| `inverse` | Content on bold/colored backgrounds |
| `input` | Form field backgrounds |

**Token naming:** every color token reads `color.{property}.{role}.{emphasis}.{state}` — e.g. `color.background.brand.bold.hovered`, `color.text.danger`, `color.border.focused`. Property = background / text / border / icon / link / chart; emphasis ranges **subtlest → subtler → subtle → (default) → bold → bolder** (bolder = more contrast vs the default surface); state = hovered / pressed.

**Accent colors** (for the `accent` role only, when no semantic meaning applies, and interchangeable): gray, red, green, blue, yellow, orange, teal, purple, magenta, lime — each with subtle/bolder variants.

**Rules:**
- Use a semantic role rather than an accent when meaning is implied; never use accent where a role is required.
- Every interactive token has `.hovered`, `.pressed`, `.selected`, and `[disabled]` variants — use them for states.
- Use `.inverse` text/icon tokens on bold backgrounds.
- Light and dark are driven by the same token names mapped to different values (see Dark/Light table) — never manually duplicate colors.
- **Contrast targets:** 3:1 for essential UI and large text (≥24px or ≥18.66px bold); 4.5:1 for text smaller than 24px.

Semantic value examples (light / dark), from `@atlaskit/tokens`:

| Token | Light | Dark |
|-------|-------|------|
| `color.text` | `#292A2E` | `#CECFD2` |
| `color.text.subtle` | `#505258` | `#A9ABAF` |
| `color.text.subtlest` | `#6B6E76` | `#96999E` |
| `color.text.inverse` | `#FFFFFF` | `#1F1F21` |
| `color.link` | `#1868DB` | `#669DF1` |
| `color.background.brand.bold` | `#1868DB` | `#669DF1` |
| `color.background.selected` | `#E9F2FE` | `#1C2B42` |
| `color.background.danger.bold` | `#C9372C` | `#F87168` |
| `color.text.danger` | `#AE2E24` | `#FD9891` |
| `color.background.success.bold` | `#5B7F24` | `#94C748` |
| `color.text.success` | `#4C6B1F` | `#B3DF72` |
| `color.background.warning.bold` | `#FBC828` | `#FBC828` |
| `color.text.warning` | `#9E4C00` | `#FBC828` |
| `color.background.discovery.bold` | `#964AC0` | `#C97CF4` |
| `color.text.discovery` | `#803FA5` | `#D8A0F7` |
| `color.background.information.bold` | `#1868DB` | `#669DF1` |
| `color.icon` | `#292A2E` | `#CECFD2` |

Some neutral tokens are **alpha** (8-digit hex, e.g. `color.border` `#0B120E24` = `#0B120E` at 14% α); the last two hex digits are the alpha channel. Prefer the token over the resolved value so it composites correctly over any surface.
