---
name: apple-design
description: Use when the user explicitly says "Apple style", "Apple Human Interface Guidelines", "HIG", "iOS style", "/apple-design", or directly asks to use or apply Apple's design system. Works for any AI agent or coding assistant that can read skill instructions. NEVER trigger automatically for generic UI or design tasks.
---

# Apple (Human Interface Guidelines) UI/UX Design System

A senior product designer's toolkit trained in Apple's Human Interface Guidelines across iOS, iPadOS, and macOS. Content-first interfaces built on clarity, deference, and depth — the system fonts, system colors, materials, and SF Symbols doing the work. Light and dark appearance with equal rigor.

**Before starting any design work, declare which fonts you're using and how to load them** (see `references/tokens.md` §1). On Apple platforms the San Francisco (SF Pro / SF Mono) and New York families are provided by the system; on the web they're licensed and must be handled with fallbacks. Never assume the SF fonts are embeddable in a non-Apple context.

---

## 1. DESIGN PHILOSOPHY

Apple's three design themes are the north star:

- **Clarity.** Text is legible at every size, icons are precise, adornments are subtle, and negative space, color, fonts, and interface elements subtly highlight important content. Legibility above decoration.
- **Deference.** Content fills the screen; the UI defers to it. Translucent materials, restrained chrome, and a light hand with color keep the focus on what the user came for — the interface never competes with the content.
- **Depth.** Distinct visual layers and realistic motion convey hierarchy and vitality. In the current system, a **Liquid Glass** functional layer (tab bars, sidebars, toolbars) floats above the content layer, letting content scroll and peek through to communicate structure.
- **The system does the heavy lifting.** Reach for standard components, system colors, Dynamic Type text styles, materials, and SF Symbols before inventing custom equivalents — they carry accessibility, appearance-switching, and platform feel for free.
- **Both appearances are first-class.** Dark and light are two renderings of the *same* semantic tokens, never hand-picked hex. Design with `label`/`systemBackground`-style semantic colors so both modes are correct automatically. Ask the user which appearance to start with.
- **Designed for everyone.** Dynamic Type, sufficient contrast, ≥44pt touch targets, VoiceOver labels, and Reduce Motion/Transparency are requirements, not polish.

---

## 2. CRAFT RULES — HOW TO COMPOSE

### 2.1 Visual Hierarchy: The Three-Layer Rule

Every screen has exactly **three layers of importance.** Not two, not five. Three.

| Layer | What | How |
|-------|------|-----|
| **Primary** | The ONE thing the user sees first. A title, a hero value, the main content. | SF Pro at `Large Title` / `Title 1` (34/28pt), or the content itself (photo, article). `label` color. Generous top spacing. |
| **Secondary** | Supporting context. Section headers, key labels, related data. | SF Pro `Headline` (17pt Semibold) / `Body` (17pt). `label` / `secondaryLabel`. Grouped tight (8–16pt) to the primary. |
| **Tertiary** | Metadata, footnotes, glyph captions. Visible but never competing. | SF Pro `Footnote` / `Caption` (13/12pt). `secondaryLabel` / `tertiaryLabel`. Pushed to edges, grouped under content. |

**The test:** Squint at the screen. Can you still tell what's most important? If two things compete, one needs to shrink, fade, or move.

**Common mistake:** Making everything the same weight. Use the Dynamic Type styles as designed — a real `Large Title` above `Body` reads instantly; a screen of same-size text reads as a wall.

### 2.2 Font Discipline

Per screen, use maximum:
- **1 typeface** — the system font (SF Pro). Add New York only for editorial/reading contexts, SF Mono only for code/numeric monospacing. Never mix several custom faces.
- **Text styles, not arbitrary sizes** — pick from the Dynamic Type scale (`Large Title`, `Title`, `Headline`, `Body`, `Callout`, `Subheadline`, `Footnote`, `Caption`). This is what makes text scale with the user's setting.
- **2–3 weights** — Regular + Semibold cover most UI; Bold for emphasized styles. **Avoid Ultralight/Thin/Light** for UI text (HIG: prefer Regular, Medium, Semibold, Bold).

Hierarchy comes from *style* (size + weight + leading together), not from bolting on new sizes.

| Decision | Text style | Weight | Color |
|----------|:---:|:---:|:---:|
| Screen title vs. body | Yes | Yes | No |
| Label vs. value | No | No | Yes (`secondaryLabel` vs `label`) |
| Active vs. inactive control | No | No | Yes (tint vs `label`) |
| Emphasized run in text | No | Yes (Semibold) | No |
| Section header vs. content | Yes | Yes | Yes |

### 2.3 Spacing & Layout

Compose on an **8pt soft grid** (steps of 4/8). Use the platform's standard layout margins (16pt on iPhone) rather than cramming to the edge, and respect the **safe area** and readable content guides.

```
Tight (4–8pt)    = "These belong together" (glyph + label, value + unit)
Medium (16pt)    = "Same group, different items" (list rows, form fields, default margin)
Wide (24–32pt)   = "New group starts here" (section breaks)
Vast (44pt+)     = "New context" (navigation title to content, major divisions)
```

**Touch targets are ≥44×44pt.** Alignment beats decoration: align to the layout margin and let whitespace group content before reaching for dividers or boxes.

### 2.4 Container Strategy (prefer top)

1. **Spacing / grouping** (proximity — the grouped-list inset style)
2. A hairline `separator` between structurally identical rows
3. A grouped background (`secondarySystemGroupedBackground` card on a `systemGroupedBackground` page)
4. A material surface (sheet, popover, sidebar) with blur + subtle shadow

Each step down adds weight and depth. Use the lightest tool that works. Reserve materials and elevation for genuinely floating layers (navigation, sheets, alerts, popovers), not for ordinary content cards.

### 2.5 Color as Communication

Color is used sparingly and semantically. The **neutral system grays and labels are the canvas**; saturated color carries meaning or marks interactivity.

```
label          → primary text and glyphs
secondaryLabel → subordinate text, captions
tertiaryLabel  → placeholder, disabled-ish
tint (systemBlue by default) → the interactive signal: links, buttons, selection
```

**The tint color marks what's tappable** — keep it consistent app-wide. Reserve the **system semantic colors** (`systemGreen` success, `systemOrange`/`systemYellow` caution, `systemRed` destructive/error) for status and destructive actions; don't paint whole backgrounds with them. Apply status color to the **element that carries the meaning** (a badge, a value, a destructive button), and never rely on color *alone* — pair it with text or an SF Symbol. See `references/tokens.md` §8.

### 2.6 Consistency vs. Variance

**Be consistent in:** the system font, **Title Case** for buttons / nav titles / labels (sentence case for longer descriptive text), the 8pt rhythm, semantic color roles, standard component shapes, and one app-wide tint.

**Let the content be the moment of variance:** a full-bleed photo, an album cover, a bold `Large Title`, or a single prominent (filled) call-to-action button among plain ones. Everything else stays quiet so that moment reads.

### 2.7 Compositional Balance

Favor the platform's natural rhythm: a large navigation title anchored top-left, content flowing beneath, actions in the toolbar/tab bar. Use alignment to the layout margins and consistent inter-group spacing. Let content breathe — deference means resisting the urge to fill every region.

### 2.8 The Apple Vibe

1. **Content is the hero.** Chrome recedes; the photo, message, or article is the design.
2. **Precision in the small things.** Optical alignment, hairline separators, SF Symbol weight matched to adjacent text, exact Dynamic Type leading.
3. **Depth through layers and materials.** Liquid Glass navigation floating over blurred content; sheets and popovers on translucent materials with vibrant labels.
4. **Familiar controls.** A switch reads as a switch, a segmented control as a segmented control. Reuse standard patterns instead of reinventing them.
5. **One clear primary action.** A single prominent/filled button per context; secondary actions stay plain or bordered.
6. **Fluid, physical motion.** Spring-based, interruptible animation that tracks the user's gesture — motion clarifies where things come from and go, and always yields to Reduce Motion.

### 2.9 Visual Variety in Data-Dense Screens

When several data sections share a screen, vary the form while keeping the voice:

| Form | Best for | Weight |
|------|----------|--------|
| Hero value (`Large Title` / `Title`) | Single key metric | Heavy — use once |
| Grouped list rows (label + value) | Settings-style data | Light |
| Progress view / activity ring | Progress toward a goal | Medium |
| Swift Charts (bar/line/area) | Trends and comparisons | Medium |
| Badge / Gauge | Status and single readings | Light |
| Inline SF Symbol + value | Compact stats in a row | Lightest |

Lead section → heaviest treatment. Secondary → different form. Tertiary → lightest. The FORM varies, the VOICE stays the same.

---

## 3. ANTI-PATTERNS — WHAT TO NEVER DO

- Don't hardcode hex where a semantic system color exists — use `label`, `systemBackground`, tint, and system colors so both appearances and accessibility settings work automatically.
- Don't put **Liquid Glass in the content layer** — reserve it for the functional layer (navigation/controls); use standard materials (ultra-thin/thin/regular/thick) for content backgrounds.
- Don't overuse translucency/blur — apply materials to floating layers, not everywhere, and keep text legible with vibrant label colors on top of materials.
- Don't fix type at pixel sizes that ignore Dynamic Type; don't use Ultralight/Thin/Light weights for UI text.
- Don't use color as the *only* signal for status; pair with text or an SF Symbol. Don't tint everything — the tint marks interactivity.
- Don't shrink touch targets below 44×44pt or crowd the safe area / layout margins.
- Don't invent custom chrome that mimics but subtly breaks standard controls (fake switches, fake nav bars). Use the real components.
- Don't disable or fight Dynamic Type, Reduce Motion, Reduce Transparency, or Increase Contrast — honor them.
- Don't over-animate. Motion is fluid and purposeful (spring, interruptible), never gratuitous; provide a reduced alternative (cross-dissolve) for Reduce Motion.
- Don't use arbitrary square or fully-sharp corners on controls — Apple corners are **continuous** (smooth "squircle") curvature, and nested corners should be concentric.

---

## 4. WORKFLOW

1. **Declare fonts** — confirm SF Pro / SF Mono / New York usage and, for web output, the fallback strategy (see `references/tokens.md` §1)
2. **Ask appearance** — light or dark (or system)? Design semantic tokens so both are correct.
3. **Pick the platform** — iOS/iPadOS vs macOS changes metrics, components, and idioms.
4. **Sketch hierarchy** — identify the 3 layers before writing any code
5. **Compose** — apply craft rules (Sections 2.1–2.9)
6. **Check tokens** — consult `references/tokens.md` for exact values
7. **Build components** — consult `references/components.md` for patterns
8. **Adapt to platform** — consult `references/platform-mapping.md` for output conventions

---

## 5. REFERENCE FILES

For detailed token values, component specs, and platform-specific guidance:

- **`references/tokens.md`** — Fonts (SF Pro/SF Mono/New York), Dynamic Type scale, system + semantic colors (light + dark), spacing/layout, materials & vibrancy, motion, SF Symbols, corner radius
- **`references/components.md`** — Buttons, text fields, lists/tables, navigation & tab bars, segmented controls, switches/steppers, progress & activity, alerts/sheets/popovers, badges, charts, state patterns
- **`references/platform-mapping.md`** — SwiftUI (primary), UIKit notes, HTML/CSS (light + dark, materials, reduced-motion), and Figma / Apple Design Resources conventions
