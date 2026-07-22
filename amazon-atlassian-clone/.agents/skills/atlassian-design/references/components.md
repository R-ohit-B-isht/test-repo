# Atlassian Design System — Components

> Labels and content are **sentence case** throughout (ADS content style). UPPERCASE is reserved for Lozenges. Prefer real `@atlaskit` components; the values below describe how they look so you can reproduce them faithfully with tokens.

## 1. CARDS / SURFACES

- Background: `elevation.surface` (default) or `elevation.surface.raised` (lifted).
- Border: `1px solid color.border`, or none. Radius: `radius.large` (8px) cards & dropdown menus, `radius.xlarge` (12px) full-page/large containers, `radius.small` (4px) compact.
- Padding: `space.200`–`space.300` (16–24px). Flat cards use the border; elevate to raised only when the card is movable or needs emphasis, and then pair `elevation.surface.raised` with `elevation.shadow.raised`.

---

## 2. BUTTONS

| Variant | Background | Text | Notes |
|---------|-----------|------|-------|
| Primary | `color.background.brand.bold` (#1868DB) | `color.text.inverse` | One primary action per view. |
| Default | `color.background.neutral` | `color.text` | Standard secondary action. |
| Subtle | transparent | `color.text.subtle` | Low-emphasis / toolbar. |
| Link | transparent | `color.link` | Navigational, inline. |
| Warning | `color.background.warning.bold` | `color.text.warning.inverse` | Reversible risky action. |
| Danger | `color.background.danger.bold` (#C9372C) | `color.text.inverse` | Destructive action. |

- Text: `Atlassian Sans`, `font.body` (14px), **sentence case**, medium weight. Radius: `radius.medium` (6px); compact buttons `radius.small` (4px).
- Heights: default 32px (`space.400`), compact 24px (`space.300`), padding `space.150` (12px) horizontal. Ensure a ≥24px hit area; touch targets ≥44px on mobile.
- States use interaction tokens: `.hovered`, `.pressed`, and `[disabled]` (`color.background.disabled` / `color.text.disabled`). Focus shows a 2px `color.border.focused` ring.
- Icon buttons: leading/trailing `@atlaskit/icon` at 16px, `space.050` gap.

---

## 3. INPUTS (TEXT FIELD)

- Background `color.background.input`, `1px solid color.border.input`, radius `radius.medium` (6px), height 32–40px.
- Label above the field: `font.body` / small, `color.text.subtle`, sentence case. Optional helper text below in `color.text.subtlest`.
- Focus: `2px solid color.border.focused` (brand). Hover: `color.border.input` → `color.border`.
- Error: border → `color.border.danger`, message below in `color.text.danger` with a danger icon.
- Disabled: `color.background.disabled`, `color.text.disabled`.
- Input text: `Atlassian Sans`; monospace fields use `Atlassian Mono`.

---

## 4. LISTS / DATA ROWS

- Dividers: `1px solid color.border`, full-width. Row padding: `space.150`–`space.200` (12–16px) vertical.
- Left: label (`color.text.subtle`, sentence case). Right: value (`color.text`).
- No alternating row backgrounds — separate rows with dividers. Hovered rows may use `color.background.neutral.subtle.hovered`; selected rows use `color.background.selected`.

**Stat rows:** Label left (`color.text.subtle`), value right (semantic status color when meaningful), unit adjacent smaller. Trend indicator matches the value color.

**Hierarchical rows:** Sub-items indented `space.200`–`space.300` (16–24px), same divider treatment; use a disclosure chevron (12px icon) for expand/collapse.

---

## 5. TABLES / DATA GRIDS (DynamicTable)

- Header: `font.body` bold or `color.text.subtle`, bottom border `color.border`. Sortable headers show a sort chevron.
- Cell text: `Atlassian Sans`; numeric right-aligned, text left. Cell padding: `space.100`–`space.150`.
- No zebra striping and no cell backgrounds. Selected row: `color.background.selected`. Hover: neutral subtle hovered.
- Support empty, loading (Skeleton rows), and pagination states.

---

## 6. NAVIGATION

- Atlassian navigation sits at `z-index: 200`. Sidebar/top nav items use sentence case.
- Item states: default `color.text.subtle`; hovered `color.background.neutral.subtle.hovered`; **selected** `color.background.selected` + `color.text.selected` (brand), often with a 2px brand indicator bar.
- Icons 16px, `space.100` gap to the label. Keep the item hit area ≥ 32px tall.

---

## 7. TAGS / LOZENGES

- **Tag** (`@atlaskit/tag`): subtle filled background by color (e.g. `color.background.accent.*.subtler`), `color.text`, radius `radius.small` (4px), sentence case, padding `space.050 space.100`. Removable and linked variants available.
- **Lozenge** (`@atlaskit/lozenge`): small status pill, **UPPERCASE**, bold weight, radius `radius.small`. Appearances map to roles: default (neutral), inprogress (brand/blue), success (green), removed (danger/red), moved (warning/yellow), new (discovery/purple). Subtle vs. bold emphasis.

---

## 8. SEGMENTED CONTROL / TABS

- Tabs: underline the selected tab with a 2px `color.border.selected` (brand) and use `color.text.selected`; inactive tabs `color.text.subtle`.
- Segmented control: container `color.background.neutral`, radius `radius.small`; selected segment `color.background.selected` + `color.text.selected`; inactive transparent + `color.text.subtle`.
- Text: `Atlassian Sans`, `font.body`, sentence case. Transition ~150ms `ease-out-practical`. Max 2–5 segments.

---

## 9. DATE / PERIOD NAVIGATION

- Use the ADS **DatePicker** (a Textfield + calendar popover in an overlay) for picking dates.
- For stepping through periods, a `< Label >` control (previous / current / next) with 12px chevron icons and ≥44px touch targets works alongside — arrows use `color.text.subtle`.

---

## 10. TOGGLES / SWITCHES

- Pill track, circular thumb. Off: `color.background.neutral` track, thumb on `elevation.surface`.
- On: `color.background.selected.bold` (brand) track, `color.text.inverse` thumb; optional check icon. Disabled dims per disabled tokens.
- Min touch target 44px; focus ring `2px color.border.focused`. Transition ~150ms.

---

## 11. PROGRESS (ProgressBar / ProgressTracker)

Progress and health read through the ADS **ProgressBar**, **ProgressTracker**, and status **Lozenges** — driven by semantic tokens, not decorative fills.

**ProgressBar anatomy:** Optional label + value above, a full-width rounded track (`radius.full`) with a filled portion below.

- Track: `color.background.neutral`. Fill: `color.background.brand.bold` (default) or `color.background.success.bold` (success appearance).
- Determinate = width % of value; indeterminate = animated sweep. Always pair with a numeric/percentage readout where precision matters.

**ProgressTracker:** Ordered steps with the current step in brand, completed steps in success/neutral, upcoming steps `color.text.subtlest`.

| State | Token |
|-------|-------|
| In progress / current | `color.background.brand.bold` |
| Success / complete | `color.background.success.bold` |
| Warning | `color.background.warning.bold` |
| Danger / over limit | `color.background.danger.bold` |

---

## 12. OTHER DATA VISUALIZATION

- Drive categorical color from semantic/chart tokens, not arbitrary hues; keep a consistent legend.
- **Bar/line charts:** fills and strokes from tokens; grid lines `color.border`, horizontal only; axis labels `font.body.small` `color.text.subtle`.
- Differentiate series by **color role → pattern → opacity**; always show the numeric value alongside the visual.
- Ensure non-color cues (labels, patterns) so meaning survives color-blindness; meet 3:1 contrast for essential graphical objects.

---

## 13. WIDGETS (DASHBOARD CARDS)

- `elevation.surface` background, `radius.large` (8px). Hero metric: `font.metric.large` (Atlassian Sans Bold), left-aligned.
- Unit smaller and adjacent. Category label top-left in `color.text.subtle`, sentence case.
- Status via ProgressBar, ProgressTracker, and Lozenge/Badge indicators. Raised (movable) widgets pair with `elevation.shadow.raised`.

---

## 14. OVERLAYS & LAYERING

Overlays (modals, dialogs, dropdowns, popups, tooltips, flags) use `elevation.surface.overlay` + `elevation.shadow.overlay` and stack via the ADS z-index scale (Inline dialog 300, Popup 400, Blanket 500, Modal 510, Flag 600, Spotlight 700, Tooltip 800).

- **Modals/Dialogs:** `color.blanket` backdrop, dialog `elevation.surface.overlay` + `elevation.shadow.overlay`, `radius.xlarge` (12px), centered; common max widths 400/600/800px. Header + body + footer action buttons (primary right). Close `X` icon-button top-right.
- **Bottom sheets / drawers:** overlay surface + shadow, slide/drag to dismiss, `radius.large` top corners.
- **Dropdown menus:** `elevation.surface.overlay` + `elevation.shadow.overlay`, `radius.small`–`radius.large`, ~32px items. Selected item: `color.background.selected` + a leading check/indicator.
- **Flags / Toasts:** ADS **Flag** at `z-index: 600` for transient confirmations (success/info/warning/error appearance); **Section message** for persistent inline status.

---

## 15. STATE PATTERNS

- **Error:** field border → `color.border.danger` + helper text in `color.text.danger`. Form-level: a **Section message** (error appearance) with danger-tinted background + icon. Transient: an error **Flag**.
- **Empty:** centered, generous padding (`space.800`+). Headline `color.text.subtle`, one-sentence description `color.text.subtlest`, and a primary call-to-action. No mascots.
- **Loading:** ADS **Spinner** for short waits; **Skeleton** placeholders for content-heavy areas; ProgressBar for known-duration tasks.
- **Disabled:** `color.background.disabled` / `color.text.disabled`; borders fade to `color.border`.

---

## 16. LAYOUT PRIMITIVES

Compose layout with ADS primitives (`@atlaskit/primitives`) so every gap/padding is a `space.*` token, not an arbitrary pixel value:

| Primitive | Use |
|-----------|-----|
| `Box` | Single element with token-based padding, background, radius, border. |
| `Inline` | Horizontal group with `space` between items + alignment (`space="100"`). |
| `Stack` | Vertical group with `space` between items — the standard way to space stacked text/paragraphs. |
| `Grid` | Two-dimensional layouts on the responsive grid. |
| `Flex` | Fine-grained flexbox with token gaps. |

Reproducing without the library: use CSS fl/grid with `gap` set to `space.*` values (8/12/16/24px), never hardcoded odd numbers.

---

## 17. @atlaskit COMPONENT QUICK-REFERENCE

Prefer these real components over bespoke builds; each ships tokens, states, and a11y:

| Need | Component | Notes |
|------|-----------|-------|
| Actions | `@atlaskit/button/new` | `appearance`: default / primary / subtle / warning / danger / link. |
| Status pill | `@atlaskit/lozenge` | UPPERCASE; appearance = default/inprogress/success/removed/moved/new. |
| Metadata pill | `@atlaskit/tag`, `@atlaskit/badge` | Tag = removable labels; Badge = numeric counts. |
| Persistent message | `@atlaskit/section-message` | info / warning / error / success / discovery, inline. |
| Transient message | `@atlaskit/flag` | Auto-dismiss toast; z-index 600. |
| User image | `@atlaskit/avatar` | `radius.full`; presence/status support. |
| Forms | `@atlaskit/form`, `textfield`, `select`, `checkbox`, `radio`, `toggle`, `range` | Labels above; built-in validation states. |
| Overlays | `@atlaskit/modal-dialog`, `dropdown-menu`, `popup`, `tooltip`, `drawer` | Overlay surface + shadow; correct z-index. |
| Navigation | `@atlaskit/atlassian-navigation`, `side-navigation`, `breadcrumbs`, `tabs`, `menu` | Selected = `color.background.selected`. |
| Data | `@atlaskit/dynamic-table`, `pagination`, `progress-bar`, `progress-tracker` | Empty/loading/pagination states. |
| Feedback | `@atlaskit/spinner`, `@atlaskit/skeleton` | Spinner short waits; Skeleton content-heavy loads. |
| Icons | `@atlaskit/icon`, `@atlaskit/icon-lab` | 16px default, tokenized color. |
