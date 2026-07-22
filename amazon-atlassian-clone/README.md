# Zaphlo — Amazon-style storefront in the Atlassian Design System

A responsive demo storefront (React + Vite + TypeScript + Tailwind CSS) rendered entirely
in the **Atlassian Design System (ADS)** aesthetic: token-driven neutral surfaces, brand
blue `#1868DB` as the single primary/selection accent, sentence-case labels, real elevation
with paired shadows, an 8px spacing rhythm, and the ADS radius mapping. Dark and light modes
are both first-class.

The design is governed by the **`atlassian-design` skill** committed under
[`.agents/skills/atlassian-design/`](.agents/skills/atlassian-design/) — read `SKILL.md` and
its `references/` for the full token/component specs this app follows.

## Screens

1. **Home / catalog** — top + side navigation (selected item uses `color.background.selected`
   + `color.text.selected`), a product grid of elevation-raised cards, and a hero "deal"
   moment with a bold `font.metric.large` price.
2. **Product detail** — hero price as the primary layer, specs/ratings secondary, a primary
   add-to-cart Button, a quantity stepper, ratings via ProgressBar, and stock/delivery status
   as Lozenges.
3. **Cart** — line items separated by `color.border` dividers (no zebra striping), order-summary
   stat rows, a primary checkout Button, a Section message for cart notices, and a Flag for
   transient confirmations.
4. **Search + filters** — a search Text Field (label above, focus ring), filter Tags, and a
   sortable DynamicTable-style results grid with sort chevrons.

## Fonts (important)

The real Atlassian product typefaces — **`Atlassian Sans`** and **`Atlassian Mono`** — are
**licensed and are NOT bundled** with this repo. This preview uses the skill's modernized
**system-font fallback stacks**:

- UI / body: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- code / mono: `ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace`

**For production**, register the licensed fonts via `@font-face` using the family names
`"Atlassian Sans"` / `"Atlassian Mono"` (see
`.agents/skills/atlassian-design/references/platform-mapping.md §1`). Because Tailwind's
`fontFamily.sans` already lists `"Atlassian Sans"` first, simply providing the `@font-face`
declarations makes the app pick up the real fonts with no further changes. Do **not** use
`Charlie Sans` (Atlassian's brand/marketing font, not the product UI font).

## Tokens & theming

All colors flow through CSS custom properties defined in [`src/index.css`](src/index.css):
`:root` / `[data-theme="dark"]` hold the dark values (near-black `#1F1F21` lightening to
`#242528` → `#2B2C2F` as it elevates) and `[data-theme="light"]` holds the light values
(white surfaces on a soft `#F8F8F8` page). One variable set themes both modes, mirrored into
`tailwind.config.js`. The theme toggle in the top nav offers **light / auto / dark** and
defaults to **auto** (follows the OS `prefers-color-scheme`).

## Sample data

[`src/data/products.ts`](src/data/products.ts) is a **sample/illustrative catalog** of ~20
fictional products (title, price, rating, category, silhouette). It is clearly labelled demo
data — not real-brand telemetry — and product images are simple neutral generated silhouettes,
not scraped assets.

## Run locally

```bash
npm install
npm run dev      # start the Vite dev server
npm run build    # typecheck (tsc -b) + production build
npm run lint     # oxlint
```

> Note: on Linux with Node 20.18, the `oxlint` and `rolldown` native bindings
> (`@oxlint/binding-linux-x64-gnu`, `@rolldown/binding-linux-x64-gnu`) are installed as
> devDependencies so lint/build run without manual setup. Vite 8 prefers Node 20.19+ / 22.12+.

## ADS rules applied (and where)

- **Three-layer hierarchy** — hero price (`font.metric.large`) is the primary layer on Home &
  Product detail; title/specs are secondary; category/metadata tertiary.
- **Brand blue as the single primary/selection accent** — one primary Button per view
  (`Button appearance="primary"`), plus selected nav/tags/segments via `color.background.selected`.
- **Sentence-case labels** — everywhere; UPPERCASE reserved for `Lozenge`.
- **Semantic color roles** — stock/delivery/ratings use success/warning/danger Lozenges and
  Section messages, never row-background color; status always pairs color with text.
- **Elevation + shadow pairing** — raised cards use `elevation.surface.raised` +
  `elevation.shadow.raised`; the Flag/overlays use the overlay surface + shadow.
- **Radius mapping** — buttons/inputs 6px, cards/menus 8px, modals/tables 12px, tags/lozenges 4px.
- **Tokenized dark/light** — exact token values wired through CSS variables for both modes.
- **Accessibility** — one `<h1>` per page, visible 2px focus rings, ≥24px hit areas, icon+label
  status (never color alone), and `prefers-reduced-motion` honored with ADS easing curves.
