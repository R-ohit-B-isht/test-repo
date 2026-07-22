# NOTHING·MART — Amazon-style storefront in the Nothing design system

A responsive demo storefront (React + Vite + TypeScript + Tailwind CSS) rendered
entirely in the **Nothing** aesthetic: monochrome canvas, a single red interrupt
accent (`#D71921`), ALL-CAPS instrument labels, segmented/mechanical components,
and flat surfaces with **no shadows or gradients**.

> This is a design preview built on top of the `nothing-design` skill
> (committed under [`.agents/skills/nothing-design/`](.agents/skills/nothing-design)).
> All product data is **sample/demo data** — not a real store, no real prices,
> stock or telemetry.

## Screens

1. **Home / catalog** (`/`) — bracket/pipe category nav, product grid, a hero
   "deal of the day" using the display treatment.
2. **Product detail** (`/product/:id`) — large hero price (primary layer),
   title/specs (secondary), add-to-cart pill, segmented quantity control,
   ratings + stock as segmented bars.
3. **Cart** (`/cart`) — line items as data rows with dividers, order-summary
   stat rows, checkout button.
4. **Search + filters** (`/search`) — underline search input, filter chips,
   sortable results (segmented control).

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
npm run lint     # oxlint
```

> Vite 8 uses the native `rolldown`/`oxlint` bindings. On Linux x64 they are
> pinned in `devDependencies` (`@rolldown/binding-linux-x64-gnu`,
> `@oxlint/binding-linux-x64-gnu`) so `build`/`lint` work in CI.

## Dark / light mode

Dark mode (OLED black) is the **default canvas**; a mechanical toggle in the
header switches to light mode ("printed technical manual", off-white paper).
Both modes use the exact token values from the skill's `tokens.md` and are
driven by a single `data-theme` attribute on `<html>` (persisted to
`localStorage`). Neither mode is derived — both get the full palette.

## Fonts — IMPORTANT (production)

The real Nothing typefaces — **`Ndot 57`** and **`NType 82`** — are licensed and
are **NOT** bundled here. This preview falls back to:

- **Body / UI / data:** a monospace stack (`"SF Mono", ui-monospace, monospace`).
- **Hero display:** a bold condensed/monospace fallback.

To ship production UI, drop the licensed `NDot-57.otf` and `NType82-Regular.otf`
into `public/fonts/` and **uncomment the `@font-face` blocks** at the top of
[`src/index.css`](src/index.css) (the `@font-face` names come from the skill's
`references/platform-mapping.md`). The `font-family` stacks already list
`"Ndot 57"` / `"NType 82"` first, so no other change is needed.

## Which Nothing skill rules were applied, and where

| Rule | Where |
|------|-------|
| **Three-layer hierarchy** (primary / secondary / tertiary) | Product detail: hero **price** = primary, title/specs = secondary, category/ETA labels = tertiary. Home hero mirrors this. |
| **Color-as-interrupt** (red `#D71921`, one per screen) | Active nav dot, "DEAL OF THE DAY" marker, over-limit stock, remove/destructive actions. Never decorative. |
| **ALL-CAPS labels** (NType 82, 0.08em tracking) | Every label, nav item, chip, stat-row key, spec key (`<Label>` primitive). |
| **Segmented components** | `SegmentedBar` (ratings, stock level, deal stock), `SegmentedControl` (sort), `QuantityControl` (mechanical −/N/+), `Toggle` (physical switch). |
| **No shadows / gradients / zebra / toasts / filled icons / spring easing** | Flat surfaces + 1px borders only; inline `[ ADDED ]` / `[ ORDER PLACED ]` status text instead of toasts; monoline Lucide icons (1.5px, no fill); `cubic-bezier(0.25,0.1,0.25,1)` ease-out only. |
| **Spacing as meaning / 8px scale** | Tailwind `spacing` maps to the skill's token scale; tight groups for number+unit, vast gaps for hero→content. |
| **Dot-matrix motif** | Product image backdrops, hero panel, empty states (`.dot-grid`). |
| **Container strategy** (lightest tool first) | Hero price floats on the background (never boxed); dividers used only in data-dense rows; surface cards only for the order summary. |

## Structure

```
src/
  data/products.ts        # ~20-item sample catalog (clearly demo data)
  state/                  # ThemeContext (dark/light), CartContext
  components/
    ui/                   # Button, Chip, SegmentedControl, SegmentedBar,
                          # Toggle, QuantityControl, StatRow, Price, Label, Rating
    ProductImage.tsx      # generated monochrome silhouettes (no scraped assets)
    ProductCard.tsx  Header.tsx
  pages/                  # Home, ProductDetail, Cart, Search
```
