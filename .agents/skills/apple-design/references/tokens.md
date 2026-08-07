# Apple (Human Interface Guidelines) Design System — Tokens

> Values reflect Apple's HIG (iOS/iPadOS defaults) and the SF font system. On Apple platforms, prefer the semantic APIs (`Color.primary`, `.font(.title)`, `Material.regular`, SF Symbols) over hardcoded values — they adapt to appearance, Dynamic Type, and accessibility settings automatically. The literal numbers below are for reproducing the look on non-Apple platforms.

## 1. TYPOGRAPHY

### Font families

| Role | Font | Fallback (web) | Notes |
|------|------|----------------|-------|
| **UI / text** | `SF Pro` (`-apple-system`, `BlinkMacSystemFont`) | `system-ui, "Helvetica Neue", Arial, sans-serif` | System sans; `SF Pro Text`/`SF Pro Display` are merged into one dynamic optical size. |
| **Rounded** | `SF Pro Rounded` | `system-ui, sans-serif` | For soft/rounded UI or a friendlier voice. |
| **Serif / reading** | `New York` (`ui-serif`) | `ui-serif, Georgia, "Times New Roman", serif` | Editorial and long-form reading. |
| **Monospace / code** | `SF Mono` (`ui-monospace`) | `ui-monospace, "SF Mono", Menlo, Consolas, monospace` | Code, numeric alignment. |

**Why these fonts:** San Francisco (SF Pro, SF Compact, SF Mono, plus SF Arabic/Armenian/Georgian/Hebrew) and New York are Apple's system typefaces. They ship as **variable fonts** with **dynamic optical sizing** (glyphs interpolate to the exact point size) and weights from Ultralight to Black.

### Loading requirements

- On iOS/iPadOS/macOS the SF and New York fonts are **provided by the system** — reference them via the OS font APIs; no embedding needed.
- On the web, the simplest reliable approach is `-apple-system` / `system-ui` (which yields SF on Apple browsers) with the fallback stacks above — non-Apple devices then get their own high-quality system font. If local SF font files are available in the project, they can be loaded with `@font-face` for a pixel-perfect look everywhere.
- The SF and New York font files, the SF Symbols app, and full UI kits are freely downloadable from Apple Design Resources (developer.apple.com/design/resources/) — grab them for design work in Figma/Sketch.

### Type scale — Dynamic Type (iOS/iPadOS, Large = default content size)

| Text style | Weight | Size (pt) | Leading (pt) | Emphasized |
|-----------|--------|-----------|--------------|-----------|
| Large Title | Regular | 34 | 41 | Bold |
| Title 1 | Regular | 28 | 34 | Bold |
| Title 2 | Regular | 22 | 28 | Bold |
| Title 3 | Regular | 20 | 25 | Semibold |
| Headline | Semibold | 17 | 22 | Semibold |
| Body | Regular | 17 | 22 | Semibold |
| Callout | Regular | 16 | 21 | Semibold |
| Subheadline | Regular | 15 | 20 | Semibold |
| Footnote | Regular | 13 | 18 | Semibold |
| Caption 1 | Regular | 12 | 16 | Semibold |
| Caption 2 | Regular | 11 | 13 | Semibold |

> These are the **Large** (default) sizes; every style scales up/down across the user's Dynamic Type settings (xSmall → AX5). Default body size is 17pt on iOS/iPadOS, 13pt on macOS; minimum 11pt (iOS)/10pt (macOS). Bind text to these **text styles**, not fixed sizes, so it scales.

### Typographic rules

- Use the text styles above rather than arbitrary sizes; keep the relative hierarchy when the user scales text (prioritize the content they care about).
- **Avoid Ultralight/Thin/Light for UI text** — prefer Regular, Medium, Semibold, Bold.
- Minimize the number of typefaces; one family (SF Pro) is usually right. Add New York or SF Mono only for a deliberate reason.
- Match **SF Symbol** weight/size to adjacent text (they share the SF metrics) so glyphs and labels align optically.
- **Title Case** for buttons, nav titles, menu items, and short labels; **sentence case** for body text, descriptions, and longer strings.

---

## 2. COLOR SYSTEM

Apple color is **semantic and appearance-adaptive**. Use the semantic tokens (label/background/fill/separator) for structure and the **system colors** for accents/status. The literal values are the documented iOS values (Default appearance).

### Semantic labels (text & glyphs)

| Token | Light | Dark |
|-------|-------|------|
| `label` | `#000000` (100%) | `#FFFFFF` (100%) |
| `secondaryLabel` | `rgba(60,60,67,0.60)` | `rgba(235,235,245,0.60)` |
| `tertiaryLabel` | `rgba(60,60,67,0.30)` | `rgba(235,235,245,0.30)` |
| `quaternaryLabel` | `rgba(60,60,67,0.18)` | `rgba(235,235,245,0.16)` |
| `placeholderText` | `rgba(60,60,67,0.30)` | `rgba(235,235,245,0.30)` |
| `link` | `#007AFF` | `#0A84FF` |

### Backgrounds & separators

| Token | Light | Dark |
|-------|-------|------|
| `systemBackground` | `#FFFFFF` | `#000000` |
| `secondarySystemBackground` | `#F2F2F7` | `#1C1C1E` |
| `tertiarySystemBackground` | `#FFFFFF` | `#2C2C2E` |
| `systemGroupedBackground` | `#F2F2F7` | `#000000` |
| `secondarySystemGroupedBackground` | `#FFFFFF` | `#1C1C1E` |
| `tertiarySystemGroupedBackground` | `#F2F2F7` | `#2C2C2E` |
| `separator` | `rgba(60,60,67,0.29)` | `rgba(84,84,88,0.60)` |
| `opaqueSeparator` | `#C6C6C8` | `#38383A` |

Fills (for UI shapes atop backgrounds): `systemFill` `rgba(120,120,128,0.20)` / `rgba(120,120,128,0.36)`, `secondarySystemFill` `.16`/`.32`, `tertiarySystemFill` `.12`/`.24`, `quaternarySystemFill` `.08`/`.18`.

### System colors (accent & status) — Default appearance

| Color | Light | Dark |
|-------|-------|------|
| `systemRed` | `#FF3B30` | `#FF453A` |
| `systemOrange` | `#FF9500` | `#FF9F0A` |
| `systemYellow` | `#FFCC00` | `#FFD60A` |
| `systemGreen` | `#34C759` | `#30D158` |
| `systemMint` | `#00C7BE` | `#66D4CF` |
| `systemTeal` | `#30B0C7` | `#40C8E0` |
| `systemCyan` | `#32ADE6` | `#64D2FF` |
| `systemBlue` | `#007AFF` | `#0A84FF` |
| `systemIndigo` | `#5856D6` | `#5E5CE6` |
| `systemPurple` | `#AF52DE` | `#BF5AF2` |
| `systemPink` | `#FF2D55` | `#FF375F` |
| `systemBrown` | `#A2845E` | `#AC8E68` |
| `systemGray` | `#8E8E93` | `#8E8E93` |

Gray ramp (light / dark): `systemGray2` `#AEAEB2`/`#636366`, `Gray3` `#C7C7CC`/`#48484A`, `Gray4` `#D1D1D6`/`#3A3A3C`, `Gray5` `#E5E5EA`/`#2C2C2E`, `Gray6` `#F2F2F7`/`#1C1C1E`.

### Color roles

| Role | Token(s) | Rule |
|------|----------|------|
| Tint / interactive | `tintColor` (default `systemBlue`) | Marks tappable elements; keep one tint per app. |
| Destructive / error | `systemRed` | Delete/destroy actions, error state. |
| Success | `systemGreen` | Completed, connected, valid. |
| Caution / warning | `systemOrange` / `systemYellow` | Pending, degraded, attention. |
| Informational | `systemBlue` | Neutral in-progress / info. |
| Selection highlight | tint at reduced opacity / `systemFill` | Selected rows, segments. |

**Rules:**
- Never rely on color alone to convey status — pair it with text or an SF Symbol (accessibility + color-blind users).
- Apply status color to the **element that carries the meaning** (badge, value, destructive button), not to whole row/section backgrounds.
- Prefer semantic tokens so **Increase Contrast** and appearance changes are handled by the system; the values above are the default (non-increased-contrast) appearance.

**Identical across appearances:** the *token names* and roles, the tint concept, Dynamic Type styles, spacing, materials usage, and component shapes. Only the resolved values differ between light and dark.

### Dark Mode specifics

- Dark Mode is a **first-class system-wide preference** (Light / Dark / Auto). Respect the system setting — **do not offer an app-only appearance toggle** that ignores it (a preview site's `prefers-color-scheme` toggle for demo purposes is fine; a shipped app should follow the OS).
- Dark values are **not simple inversions** of light — some colors invert, some don't. Always drive color from the semantic tokens (or asset-catalog **Color Sets** with light/dark variants), never hardcoded hex.
- Dark Mode uses **two background levels**: a **base** and a lighter **elevated** level. Presented/modal content and popovers use the *elevated* backgrounds so they read as raised above the base; the system does this automatically for standard presentations.
- Contrast: aim for ≥ 4.5:1 (7:1 for custom small text). With Increase Contrast + Reduce Transparency on, re-check that dark text isn't lost on dark backgrounds.
- Slightly darken imported images that have white backgrounds so they don't "glow" in a dark context. Prefer SF Symbols and appearance-optimized assets.

---

## 3. SPACING & LAYOUT

Apple composes on an **8pt soft grid** (steps of 4/8). There is no fixed public "token scale," but these aliases match Apple's rhythm:

| Token | Value | Use |
|-------|-------|-----|
| `--space-2xs` | 2pt | Optical adjustments |
| `--space-xs` | 4pt | Glyph-to-label gaps, tight padding |
| `--space-sm` | 8pt | Component internal spacing |
| `--space-md` | 16pt | **Standard layout margin (iPhone)**, row padding, element gaps |
| `--space-lg` | 20pt | Grouped content insets |
| `--space-xl` | 24pt | Group separation |
| `--space-2xl` | 32pt | Section breaks |
| `--space-3xl` | 44pt | Context divisions / min touch target |

- **Minimum touch target: 44×44pt.** Space controls so their tap areas don't collide.
- Respect the **safe area** (notch, Dynamic Island, home indicator) and the **readable content guide** for long text (don't run body text edge-to-edge on wide screens).
- Default iPhone layout margin is 16pt; grouped-list content uses standard insets. Align to the margin rather than centering everything.

### Adaptivity & size classes

- Design **adaptive** layouts, don't just scale one size. iOS/iPadOS express context as **size classes** — compact vs regular width/height — and layouts should reflow between them (e.g. a stacked iPhone view becomes a split view / sidebar on iPad or landscape).
- Support multitasking (Split View / Slide Over / Stage Manager) and window resizing on iPad/macOS; never assume a fixed screen size.
- Keep key content within the **safe area** and honor device features (Dynamic Island, home indicator, rounded corners). On the web, mirror this with responsive breakpoints and `env(safe-area-inset-*)`.

---

## 4. MATERIALS & DEPTH

Depth is a core theme. Two categories:

**Liquid Glass (functional layer only).** The dynamic material for navigation and controls — tab bars, sidebars, toolbars — that floats above content, letting content scroll/peek beneath. Two variants:
- `regular` — blurs and adjusts luminosity to keep foreground legible; use for text-heavy floating elements (alerts, sidebars, popovers). Most system components use this.
- `clear` — highly translucent; only for controls floating over rich media (photo/video). Add a ~35% dark dimming layer when the background is bright.
- **Do NOT use Liquid Glass in the content layer,** and apply custom Liquid Glass effects sparingly — it should spotlight content, not distract.

**Standard materials (content layer).** iOS/iPadOS provide four, by thickness/opacity:

| Material | Relative | Use |
|----------|----------|-----|
| `ultraThinMaterial` | most translucent | Light overlays where context should remain visible |
| `thinMaterial` | translucent | Secondary panels |
| `regularMaterial` | default | General grouped backgrounds, sheets |
| `thickMaterial` | most opaque | Best text contrast over busy backgrounds |

**Vibrancy.** iOS/iPadOS define vibrant colors for **labels, fills, and separators** designed to sit on materials. Always use vibrant label colors on top of a material rather than a fixed gray like `systemGray3` — it keeps contrast correct across contexts. Choose a material by *semantic meaning/contrast need*, not by the apparent tint it produces.

**Shadow / elevation.** Reserve shadows for genuinely floating layers (sheets, popovers, alerts, menus) — a soft, low-opacity ambient shadow plus the material. Ordinary content cards use a grouped background + hairline separator, not a drop shadow. Honor **Reduce Transparency** (materials fall back to opaque) and **Increase Contrast**.

---

## 5. MOTION

- **Character:** fluid, physical, **spring-based**, and interruptible — motion should track the user's gesture and show where things come from and go. This is the opposite of stiff linear tweens.
- **Duration:** keep UI transitions short (~0.2–0.5s); interactive/gesture-driven animation has no fixed duration (it follows the finger).
- **Easing:** prefer SwiftUI springs (`.spring`, `.snappy`, `.bouncy`, `.smooth`) on native; on the web approximate with `cubic-bezier(0.25, 0.1, 0.25, 1)` (standard) or a spring library.
- **Purposeful, not decorative:** animate to explain hierarchy and continuity (push/pop, sheet present, expand). Avoid gratuitous parallax or scroll-jacking.
- **Accessibility:** honor **Reduce Motion** — replace large slides/zoom/parallax with a simple cross-dissolve or no animation. Never flash content (seizure risk).

---

## 6. SF SYMBOLS (ICONOGRAPHY)

- Use **SF Symbols** for interface glyphs — 6,000+ symbols that align with SF text automatically. Prefer them over custom icons for standard concepts.
- **9 weights** (Ultralight→Black) matching the font weights, and **3 scales** (small / medium / large). Match a symbol's weight/scale to adjacent text.
- **Rendering modes:** `monochrome` (single color — default, usually the tint or `label`), `hierarchical` (one color, multiple opacity levels), `palette` (two/three explicit colors), `multicolor` (built-in meaningful colors). Some symbols support **variable color** for state/progress.
- Many symbols have **outline and filled** variants — filled reads better in dense UI like tab bars; outline for lighter contexts. (Filled icons are expected here — unlike thin-line-only systems.)
- Size symbols by **point size** aligned to text; give them adequate padding and a ≥44pt tap area when interactive. Add an accessibility label when a symbol conveys meaning.
- For a custom symbol, follow the SF Symbols template weights/scales so it behaves like a system symbol.

---

## 7. CORNER RADIUS & SHAPE

- Apple uses **continuous corner curvature** (the smooth "squircle"), not a simple circular arc. On SwiftUI use `RoundedRectangle(cornerRadius:, style: .continuous)`; on the web approximate with a slightly larger `border-radius` (or an SVG squircle for hero shapes).
- **Concentric corners:** when nesting rounded shapes, the outer radius ≈ inner radius + padding, so curves stay parallel.
- Typical radii: small controls/inputs ~8–10pt, cards/grouped containers ~10–14pt, sheets ~10pt top corners, alerts ~14pt. **Capsule** (fully rounded) for prominent pill buttons, tags, and some toggles. App icons use Apple's fixed superellipse mask — don't recreate it manually.
- Border width: hairline separators are 1px (0.5pt on @2x/@3x); controls generally rely on fill/material + shape rather than visible strokes.

---

## 8. ACCESSIBILITY QUICK REFERENCE

- **Contrast:** aim for WCAG-style ratios — 4.5:1 for body text, 3:1 for large text and essential glyphs; support **Increase Contrast** (system provides higher-contrast color variants).
- **Dynamic Type:** everything scales; test at the largest accessibility sizes and keep hierarchy intact.
- **Targets:** ≥44×44pt.
- **Motion / transparency:** honor Reduce Motion and Reduce Transparency.
- **Don't encode meaning in color alone.** Pair with text/symbol/shape.
- **VoiceOver:** every control and meaningful image has a label; decorative art is hidden from assistive tech.

---

## 9. INTERNATIONALIZATION & RIGHT-TO-LEFT

- Think in **leading/trailing**, not left/right. System frameworks flip standard layouts and components automatically for RTL languages (Arabic, Hebrew) — use standard layout so you get this for free.
- **Mirror** directional things (back/forward chevrons, progress direction, sliders, text alignment). **Don't mirror** direction-agnostic glyphs: checkmarks, clock/time, media playback controls (play points to time, not reading order), and images whose meaning is fixed.
- Align a paragraph by its **language**, not the current context; align UI text to match the interface direction.
- Leave room for text expansion (localized strings can be much longer); never hardcode widths to fit English. Format numbers, dates, and currency with the locale.

---

## 10. FEEDBACK & HAPTICS

- Give timely, appropriate feedback: activity spinners/progress for waits, subtle transient confirmations for success, inline messages for errors. Keep the UI responsive to touch.
- Use **system haptics** (via the standard feedback generators / patterns) to reinforce meaningful events — selection changes, success/warning/error, and control interactions. Use standard, semantically-correct haptic patterns; don't invent buzzes or overuse them.
- Pair haptics with visual (and where relevant audio) feedback — never rely on haptics alone. Respect the user's system settings.

---

## 11. APP ICONS & BRANDING

- **App icon:** a single, simple, recognizable image on Apple's fixed **rounded-rectangle superellipse** grid — the system applies the mask, so supply a full-bleed square with **no transparency**, and avoid baking in the exact rounded corners. Avoid words/UI screenshots; provide light/dark/tinted variants where supported.
- **Branding is restrained:** express the brand through tone, typography choices, and a considered accent/tint — not by plastering the logo across the UI or overriding standard controls. Don't display the logo in the nav bar where a title belongs. Let content, not chrome, carry the brand.

---

## 12. WRITING (VOICE & CAPITALIZATION)

- **Capitalization:** **Title Case** for buttons, menu items, labels, and short titles; **sentence case** for body text, messages, and longer descriptive strings. Be consistent.
- Be **clear and concise** — front-load the important words, avoid jargon, and don't repeat words already shown in a nearby heading/label (reduce cognitive load).
- Use **consistent terminology** for the same concept throughout; write button labels that name the action they perform. Keep alerts short: a clear title, a brief message, and specific button verbs (e.g. "Delete" / "Keep") rather than "OK/Cancel" when a verb is clearer.
