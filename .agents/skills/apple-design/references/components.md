# Apple (Human Interface Guidelines) Design System — Components

> Prefer real system components (SwiftUI/UIKit) — they carry appearance, Dynamic Type, and accessibility for free. The specs below describe how the standard components look so you can reproduce them faithfully (e.g. on the web) with the tokens in `tokens.md`. Buttons/nav titles/labels are **Title Case**; longer text is sentence case.

## 1. CARDS / GROUPED SURFACES

- The iOS pattern is a **grouped list**: `secondarySystemGroupedBackground` cards on a `systemGroupedBackground` page.
- Corner radius ~10–14pt, **continuous** curvature. Separators are hairline `separator` insets, not full boxes.
- Reserve drop shadows for floating layers (sheets/popovers); content cards use the grouped background + hairline, not elevation.
- Padding: 16pt standard (layout margin); 12–16pt row vertical padding.

---

## 2. BUTTONS

SwiftUI button roles/styles map to these appearances:

| Variant | Fill | Text | Shape |
|---------|------|------|-------|
| Prominent / Filled (`.borderedProminent`) | tint (`systemBlue`) | white | Capsule or continuous rounded rect |
| Gray / Bordered (`.bordered`) | `tertiarySystemFill` | tint | Capsule / rounded rect |
| Plain (`.plain` / `.borderless`) | none | tint | — |
| Destructive (`role: .destructive`) | tint→`systemRed` text, or filled `systemRed` for the primary destructive | `systemRed` / white | as above |

- Text: SF Pro `Body`/`Headline` (17pt), **Title Case**, Regular/Semibold. One **prominent** button per context; everything else plain or bordered.
- Min height 44pt; horizontal padding ~16–20pt. Capsule buttons are common for prominent CTAs.
- States: pressed = slight dim/scale; disabled = reduced opacity (`tertiaryLabel`-level). Provide a visible focus ring on keyboard/tvOS focus.
- Leading/trailing SF Symbol allowed; match its weight to the label.

---

## 3. TEXT FIELDS

- Rounded-rect field: `tertiarySystemFill` (or `secondarySystemGroupedBackground`) fill, continuous radius ~8–10pt, height ≥44pt. macOS uses a bordered `roundedBorder` style.
- Label: above or leading, `Subheadline`/`Footnote`, `secondaryLabel`, Title/sentence case. Placeholder uses `placeholderText`.
- Focus: tint ring / caret in tint color. Error: message below in `systemRed` with an SF Symbol (e.g. `exclamationmark.circle`).
- Show a **Clear** button (`xmark.circle.fill`) when editing; use the right keyboard type and content type for autofill.
- Input text: SF Pro `Body`; numeric/monospaced entry can use SF Mono.

---

## 4. LISTS / DATA ROWS

- Standard `List` rows: leading label (`label`), trailing value (`secondaryLabel`), optional leading SF Symbol, trailing chevron (`chevron.right`) for navigation.
- Separators: hairline `separator`, inset to align with text (not full-bleed under the icon). No zebra striping.
- Row padding 12–16pt vertical; min row height 44pt. Selected row: `systemFill`/tint highlight.
- **Section headers/footers:** `Footnote`, `secondaryLabel`; header often uppercased in plain grouped lists (system does this automatically) — don't hand-uppercase content strings.
- **Swipe actions** (trailing/leading) and context menus are the idiomatic row actions.

---

## 5. TABLES / DATA (macOS / iPadOS)

- Use `Table` with sortable columns; header row in `Subheadline`/`Footnote`, `secondaryLabel`, with sort indicator.
- Numeric columns right-aligned, text left. Row selection uses tint highlight; no cell backgrounds, no zebra by default (macOS may use subtle alternating rows — acceptable there).
- Support empty and loading states; paginate or lazy-load large sets.

---

## 6. NAVIGATION & TAB BARS

- **Navigation bar:** large title (`Large Title`) that collapses to an inline title (`Headline`) on scroll; back button shows a chevron + previous title in tint. Bar sits on the **Liquid Glass** functional layer.
- **Tab bar (iOS):** 2–5 tabs, each an SF Symbol + short Title-Case label; selected tab uses tint (often the filled symbol variant), unselected uses `secondaryLabel`. Floats on Liquid Glass with content peeking beneath.
- **Sidebar (iPadOS/macOS):** grouped items with SF Symbols; selected item uses tint highlight.
- **Toolbar:** actions as SF Symbol buttons; place the primary action trailing.

---

## 7. TAGS / BADGES / STATUS PILLS

- **Badge:** small count/indicator — capsule, `systemRed` (or tint) fill, white text, `Caption`. Used on tab bars and list rows.
- **Status pill:** capsule with a system color at low opacity fill + matching text, or filled for emphasis; pair with an SF Symbol/text, never color alone.
- **Tag/token field:** capsule chips with `tertiarySystemFill`, `Subheadline`, removable via `xmark.circle.fill`.

---

## 8. SEGMENTED CONTROL

- Container: `tertiarySystemFill` track, continuous rounded rect, height ~32–44pt. Selected segment: a raised `systemBackground` "thumb" that slides (spring) with a subtle shadow.
- Text/symbol: SF Pro `Subheadline`/`Body`, Title Case, `label` (selected) vs `secondaryLabel`. 2–5 segments.
- Transition: spring slide of the selection thumb; honor Reduce Motion (cross-fade).

---

## 9. DATE & TIME

- Use the system **DatePicker**: compact (a tappable field opening a calendar/wheel popover), inline graphical calendar, or wheel. Don't build a custom calendar unless necessary.
- Present in a popover (iPadOS/macOS) or inline/sheet (iPhone). Respect locale and 12/24h settings.

---

## 10. TOGGLES / STEPPERS / SLIDERS

- **Switch:** capsule track, circular thumb. On = tint (`systemGreen` is the classic on-color for the system switch) with thumb slid right; off = `systemFill` track. ≥44pt target. When activated, transient controls (sliders/toggles) can take on a Liquid Glass appearance.
- **Stepper:** `−`/`+` in a segmented capsule for small increments; pair with a value label.
- **Slider:** thin track, tint minimum-track, circular thumb; optional min/max SF Symbols at the ends.

---

## 11. PROGRESS & ACTIVITY

- **Determinate:** `ProgressView(value:)` — thin capsule bar, tint fill on `tertiarySystemFill` track; pair with a `Footnote` percentage/label.
- **Indeterminate:** system **activity spinner** (`ProgressView()`), not a custom skeleton-only screen. Skeleton/redacted placeholders (`.redacted(reason:)`) are fine for content-heavy loads.
- **Activity rings / Gauge:** `Gauge` for a single reading; concentric rings for related percentages. Use tint/system colors + a numeric readout.

---

## 12. DATA VISUALIZATION (Swift Charts)

- Use **Swift Charts** (`BarMark`, `LineMark`, `AreaMark`, `PointMark`) on native. Line ~2pt in tint/system color; axes/gridlines in `separator`; labels `Caption`/`Footnote` in `secondaryLabel`.
- Differentiate series by color **and** a second channel (symbol/dash/label) so it works without color. Provide accessible chart descriptors.
- Always show the precise value alongside the visual for key metrics.

---

## 13. WIDGETS (WidgetKit)

- Fixed families (small/medium/large/accessory). Content-first: one hero value in `Title`/`Large Title`, supporting label in `Caption`, SF Symbol accents.
- Use system materials/vibrancy for the background; support light/dark and tinted/rendered modes. No interactive-only affordances that don't deep-link.

---

## 14. OVERLAYS & LAYERING (materials + depth)

- **Alert:** centered, `regular` material, ~14pt continuous corners, title `Headline` + message `Footnote`, stacked/side-by-side buttons; destructive action in `systemRed`, default action Semibold. Backdrop dims the content.
- **Action sheet / menu:** contextual list of actions on a material with vibrant labels; destructive in red, Cancel separated.
- **Sheet:** slides up with a grab handle (`.presentationDetents`), continuous top corners ~10pt, `systemBackground`/material; supports medium/large detents and drag-to-dismiss.
- **Popover:** floating material panel with an arrow anchor (iPadOS/macOS), soft ambient shadow.
- **Confirmation/status:** use a transient overlay or in-context change, not a custom toast library; keep it brief and non-blocking.

All overlays float on materials with a subtle shadow; honor Reduce Transparency (opaque fallback).

---

## 15. STATE PATTERNS

- **Error:** field border/message in `systemRed` + an SF Symbol; form-level issues in an alert or an inline message. Never rely on red alone.
- **Empty:** centered, generous padding; an SF Symbol, a `Headline` title, a one-line `secondaryLabel` description, and a primary action. No mascots.
- **Loading:** system activity spinner for short waits; `ProgressView(value:)` for known duration; redacted/skeleton placeholders for content-heavy screens.
- **Disabled:** reduced opacity / `tertiaryLabel`; control remains laid out and labeled for VoiceOver.
- **Selected/active:** tint highlight or filled SF Symbol variant.
