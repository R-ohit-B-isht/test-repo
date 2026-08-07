# Store — an Amazon-style storefront in the Apple HIG aesthetic

A responsive React + Vite + TypeScript + Tailwind demo storefront rendered
entirely in Apple's Human Interface Guidelines look: content-first with
restrained chrome, semantic appearance-adaptive color wired through CSS custom
properties, one app-wide tint marking interactivity, an 8pt spacing grid with
≥44px tap targets, continuous corners, and depth via translucent materials.

Built by applying the **`apple-design`** skill (committed under
`.agents/skills/apple-design/`).

## Screens

1. **Home / Catalog** (`/`) — large-title nav bar, hero "Deal of the Day" moment
   (bold `Large Title` price), and a grid of grouped-background product cards.
2. **Product Detail** (`/product/:id`) — hero price as the primary layer,
   title/specs secondary, a filled tint **Add to Cart** capsule, a **stepper**
   for quantity, and ratings via a determinate progress bar + status pill.
3. **Cart** (`/cart`) — line items as hairline-separated grouped rows, an
   order-summary section of label→value rows, an inline section note, and a
   brief non-blocking "Added to Cart" / "Order Placed" confirmation.
4. **Search + Filters** (`/search`) — rounded search field with a clear button,
   capsule filter chips, and a sortable `Table`-style results list.

## Fonts — why San Francisco is NOT bundled

San Francisco (SF Pro, SF Mono) and New York are Apple's system typefaces and
are **licensed for use on Apple platforms only**. They are deliberately **not
downloaded, self-hosted, or bundled** into this web app. Instead the app uses
the HIG fallback stacks, which render the real system fonts on Apple browsers
and graceful fallbacks elsewhere:

- UI / body: `-apple-system, BlinkMacSystemFont, system-ui, "Helvetica Neue", Arial, sans-serif`
- Serif: `ui-serif, "New York", Georgia, serif`
- Mono / numeric: `ui-monospace, "SF Mono", Menlo, Consolas, monospace`

Text is bound to the **Dynamic Type** text styles (Large Title / Title /
Headline / Body / Callout / Subheadline / Footnote / Caption) rather than
arbitrary pixel sizes, and Ultralight/Thin/Light weights are avoided.

## Appearance (light & dark)

Both appearances are first-class. Semantic tokens use the **exact** HIG values
(e.g. light `label #000`, `systemBackground #FFF`, grouped page `#F2F2F7`, card
`#FFF`, `separator rgba(60,60,67,.29)`; dark `label #FFF`, `systemBackground
#000`, grouped page `#000`, card `#1C1C1E`, `separator rgba(84,84,88,.60)`) and
are wired through one CSS custom-property set (`src/index.css`), so a single
variable set themes both modes. The toggle (top-right sun/moon) cycles
System → Light → Dark and defaults to the system via `prefers-color-scheme`.

Floating layers (nav bar, tab bar, transient confirmation) approximate a
**material** with `backdrop-filter: blur()` + a translucent background, with a
Reduce Transparency (opaque) fallback. Motion is spring-based and honors
`prefers-reduced-motion` (slides/zoom degrade to a cross-dissolve).

## Data

`src/data/products.ts` is a **sample demo catalog** of ~20 fictional products
(title, price, rating, category, generated silhouette image). It is clearly
labelled sample data — not real listings and no scraped Amazon assets. Product
imagery is generated neutral silhouettes; glyphs are original SF-Symbol-style
monoline icons (`src/components/Icon.tsx`), not the licensed SF Symbols font.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b && vite build
npm run lint     # oxlint
```

> On Linux you may need the native binding for the bundler/linter:
> `npm i -D @rolldown/binding-linux-x64-gnu @oxlint/binding-linux-x64-gnu`.
