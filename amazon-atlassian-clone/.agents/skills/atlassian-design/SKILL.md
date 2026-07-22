---
name: atlassian-design
description: Use when the user explicitly says "Atlassian style", "Atlassian Design System", "/atlassian-design", or directly asks to use or apply the Atlassian design system. Works for any AI agent or coding assistant that can read skill instructions. NEVER trigger automatically for generic UI or design tasks.
---

# Atlassian-Inspired UI/UX Design System

A senior product designer's toolkit trained in enterprise product design and Atlassian's token-driven foundations (color, spacing, typography, elevation, motion). Token-driven, neutral-surfaced, brand-blue accented — information-dense yet calm and accessible. Dark and light mode with equal rigor.

**Before starting any design work, declare which Atlassian font assets are required and how to load them** (see `references/tokens.md` Section 1). Never assume fonts are already available.

---

## 1. DESIGN PHILOSOPHY

- **Foundational before flexible.** Solve common problems with opinionated building blocks and reject infinite flexibility.
- **Tokens are the source of truth.** Choose a design token by intent — never a raw hex or pixel value.
- **The neutral surface is the canvas.** Color carries meaning: apply it through semantic tokens (brand, information, success, warning, danger, discovery), not decoration.
- **Tokens and type does the heavy lifting.** Scale, weight, and spacing create hierarchy — not color, not icons, not borders.
- **Both modes are first-class.** Dark mode: near-black neutral surface (#1F1F21) that lightens as it elevates. Light mode: white surfaces (#FFFFFF) on a soft neutral page (#F8F8F8). Neither is "derived" — both get full design attention. Ask the user which mode to start with.
- **Harmonious and empowering.** Building blocks work together as one family and stay accessible to everyone, regardless of role, experience, or ability.

---

## 2. CRAFT RULES — HOW TO COMPOSE

### 2.1 Visual Hierarchy: The Three-Layer Rule

Every screen has exactly **three layers of importance.** Not two, not five. Three.

| Layer | What | How |
|-------|------|-----|
| **Primary** | The ONE thing the user sees first. A number, a headline, a state. | Atlassian Sans Bold at display/metric size (`font.heading.xxlarge` / `font.metric.large`). `--text-display`. Generous breathing room. |
| **Secondary** | Supporting context. Labels, descriptions, related data. | Atlassian Sans at `font.body` / `font.heading.small`. `--text-primary`. Grouped tight (8–16px) to the primary. |
| **Tertiary** | Metadata, navigation, system info. Visible but never competing. | Atlassian Sans at caption/label. `--text-secondary` or `--text-disabled`. Sentence case. Pushed to edges or bottom. |

**The test:** Squint at the screen. Can you still tell what's most important? If two things compete, one needs to shrink, fade, or move.

**Common mistake:** Making everything "secondary." Evenly-sized elements with even spacing = visual flatness. Be brave — make the primary absurdly large and the tertiary absurdly small. The contrast IS the hierarchy.

### 2.2 Font Discipline

Per screen, use maximum:
- **1 font family** (Atlassian Sans for UI; Atlassian Mono only for code). Hierarchy comes from weight and the `font.heading`/`font.body`/`font.metric` scale.
- **3–4 type sizes** drawn from the token scale (a heading, body, and a small/label)
- **2 font weights** (Regular 400 + Bold 700; use Medium beside line icons, Bold sparingly)

Think of it as a budget. Every additional size/weight costs visual coherence. Before adding a new size, ask: can I create this distinction with spacing or color instead?

| Decision | Size | Weight | Color |
|----------|:---:|:---:|:---:|
| Heading vs. body | Yes | No | No |
| Label vs. value | No | No | Yes |
| Active vs. inactive nav | No | No | Yes |
| Hero number vs. unit | Yes | No | No |
| Section title vs. content | Yes | Optional | No |

**Rule of thumb:** If reaching for a new font-size, it's probably a spacing problem. Add distance instead.

### 2.3 Spacing as Meaning

Spacing is the primary tool for communicating relationships.

```
Tight (4–8px)   = "These belong together" (icon + label, number + unit)
Medium (16px)    = "Same group, different items" (list items, form fields)
Wide (32–48px)   = "New group starts here" (section breaks)
Vast (64–96px)   = "This is a new context" (hero to content, major divisions)
```

**If a divider line is needed, the spacing is probably wrong.** Dividers are a symptom of insufficient spacing contrast. Use them only in data-dense lists where items are structurally identical.

### 2.4 Container Strategy (prefer top)

1. **Spacing alone** (proximity groups items)
2. A single divider line
3. A subtle border outline
4. A surface card with background change

Each step down adds visual weight. Use the lightest tool that works. Never box the most important element — let it float on the background.

### 2.5 Color as Hierarchy

In a neutral-with-semantic-accents system, the neutral scale IS the hierarchy. Max 4 levels per screen:

```
--text-display (100%) → Hero numbers. One per screen.
--text-primary (90%)  → Body text, primary content.
--text-secondary (60%) → Labels, captions, metadata.
--text-disabled (40%) → Disabled, timestamps, hints.
```

**Brand blue (#1868DB) sits outside the neutral hierarchy.** Reserve it for the primary action and the current selection — typically one primary action per view — so it stays meaningful. Everything neutral stays neutral.

**Semantic status colors** (success green, warning yellow, danger red, discovery purple, information blue) encode meaning, not decoration. Apply the color to the **value / status element itself** (a Lozenge, a metric, a Section message) — not to whole row backgrounds. See `references/tokens.md` §8 for the full role system.

### 2.6 Consistency vs. Variance

**Be consistent in:** Font family (Atlassian Sans), label treatment (sentence case; UPPERCASE only for Lozenges), 8px spacing rhythm, semantic color roles, radius/elevation, alignment.

**Break the pattern in exactly ONE place per screen:** A single brand-blue primary button among neutral controls, a bold metric in `font.metric.large`, a discovery-purple new-feature moment, or a raised card lifted above a sunken well.

This single break IS the design. Without it: sterile grid. With more than one: visual chaos.

### 2.7 Compositional Balance

**Asymmetry > symmetry.** Centered layouts feel generic. Favor deliberately unbalanced composition:
- **Large left, small right:** Hero metric + metadata stack.
- **Top-heavy:** Big headline near top, sparse content below.
- **Edge-anchored:** Important elements pinned to screen edges, negative space in center.

Balance heavy elements with more empty space, not with more heavy elements.

### 2.8 The Atlassian Vibe

1. **Confidence through emptiness.** Large uninterrupted background areas. Resist filling space.
2. **Precision in the small things.** Letter-spacing, exact neutral values, 4px gaps. Micro-decisions compound into craft.
3. **Data as beauty.** A metric like `1,284` in `font.metric.large` (Atlassian Sans Bold) IS the visual. No illustrations needed.
4. **Clarity through familiarity.** Controls look like their ADS counterparts. A toggle reads as a switch, a Lozenge reads as a status — reuse patterns rather than inventing them.
5. **One moment of surprise.** A single brand-blue primary action. A bold metric number. A discovery-purple spotlight. Restraint makes the one expressive moment powerful.
6. **Human, not mechanical.** Motion is subtle, rhythmic, and intuitive — warm and alive rather than mechanical — and always honors reduced-motion settings.

### 2.9 Visual Variety in Data-Dense Screens

When 3+ data sections appear on one screen, vary the visual form:

| Form | Best for | Weight |
|------|----------|--------|
| Hero metric (`font.metric.large`, Atlassian Sans Bold) | Single key metric | Heavy — use once |
| ProgressBar | Progress toward goal | Medium |
| Concentric rings / arcs | Multiple related percentages | Medium |
| Inline compact bar | Secondary metrics in rows | Light |
| Number-only with status color | Values without proportion | Lightest |
| Sparkline | Trends over time | Medium |
| Stat row (label + value) | Simple data points | Light |

Lead section → heaviest treatment. Secondary → different form. Tertiary → lightest. The FORM varies, the VOICE stays the same.

### 2.10 Accessibility (non-negotiable)

ADS targets **WCAG 2.1/2.2 AA**. Bake these in from the start, not as a pass at the end:

- **Contrast:** text < 24px (or < 18.66px bold) needs ≥ 4.5:1; large text and essential UI/graphics need ≥ 3:1. Using the semantic `color.text.*` tokens on their intended surfaces already meets this.
- **Never rely on color alone.** Pair status color with an icon, label, or Lozenge text (e.g. a red border *and* an error message). Charts differentiate by pattern/label too.
- **Focus visible:** every interactive element shows a 2px `color.border.focused` ring (`radius.*.focused`). Never remove focus outlines.
- **Semantic headings:** one `<h1>` per page, descending order, no skipped levels — heading *styles* (not bold text) so assistive tech can navigate.
- **Target size:** ≥ 24px minimum hit area; ≥ 44px on touch.
- **Reduced motion:** honor `prefers-reduced-motion` — make transitions instant/minimal; never flash or rapidly oscillate.
- **Labels & alt text:** form fields have visible labels; icon-only buttons need `aria-label`; meaningful images need alt text, decorative ones empty alt.
- **Keyboard:** everything operable by keyboard in a logical tab order; overlays trap focus and close on `Esc`.

---

## 3. ANTI-PATTERNS — WHAT TO NEVER DO

- No decorative gradients in UI chrome — surfaces are solid neutral tokens (`elevation.surface*`)
- Use elevation intentionally: pair `elevation.surface.raised`/`overlay` with their matching `elevation.shadow` tokens; never mix mismatched surface/shadow tokens, and don't stack raised cards where a border or whitespace would do.
- For loading, use ADS **Spinner** or **Skeleton** — show `Loading…` text only where a component isn't warranted.
- For transient confirmation use a **Flag**; for persistent inline status use a **Section message** — don't invent custom toast styling.
- No sad-face illustrations, cute mascots, or multi-paragraph empty states.
- No zebra striping in tables — separate rows with `color.border` dividers.
- Icons follow the ADS line style (1.5px stroke, square terminals); no multi-color icons or emoji as UI.
- No parallax, scroll-jacking, or gratuitous animation.
- No spring/bounce. Use the ADS easing curves (ease-out bold, ease-in-out bold, ease-in/out practical); keep high-frequency motion under 150ms and honor `prefers-reduced-motion`.
- Match radius to element type: buttons/inputs `radius.medium` (6px), cards/menus `radius.large` (8px), modals/tables `radius.xlarge` (12px), tags/lozenges `radius.small` (4px). Reserve `radius.full` for Avatars and other circular/people UI.
- Never hardcode hex/px where a token exists; pick tokens by semantic role, not by hue.
- Decorative gradients aren't part of ADS chrome — use solid `elevation.surface*` tokens and pair raised/overlay surfaces with matching shadow tokens.

---

## 4. WORKFLOW

1. **Declare fonts** — tell the user which Atlassian font assets to load (see `references/tokens.md`)
2. **Ask mode** — dark or light? Neither is default.
3. **Sketch hierarchy** — identify the 3 layers before writing any code
4. **Compose** — apply craft rules (Sections 2.1–2.9)
5. **Check tokens** — consult `references/tokens.md` for exact values
6. **Build components** — consult `references/components.md` for patterns
7. **Adapt to platform** — consult `references/platform-mapping.md` for output conventions

---

## 5. REFERENCE FILES

For detailed token values, component specs, and platform-specific guidance:

- **`references/tokens.md`** — Fonts, type scale, color system (dark + light), spacing scale, motion, iconography, elevation (levels + z-index), shape/radius, semantic color roles
- **`references/components.md`** — Cards, buttons, inputs, lists, tables, nav, tags/lozenges, progress, charts, widgets, overlays, state patterns, layout primitives, `@atlaskit` component quick-reference
- **`references/platform-mapping.md`** — HTML/CSS (light + dark, motion, reduced-motion), SwiftUI, React/`@atlaskit` + Tailwind, Figma, and a worked dashboard-card example
