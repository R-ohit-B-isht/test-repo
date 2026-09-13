---
name: screenroom-critique-pass
description: Side-by-side critique of a built UI against Screenroom reference screenshots, ending in 8+ concrete fixes. Use after the first implementation pass of any user-facing UI.
---

# Critique pass against references

One-shot output from references is structurally right but visually inferior.
This skill closes the gap.

## Steps

1. Screenshot your build at 375, 768, 1440 and 1920 in both themes.
2. Place each screenshot next to the reference screenshot it was anchored on
   (from your reference matrix) at equal zoom.
3. For every section, note where yours is weaker: hierarchy (one focal point?),
   density, type scale, spacing rhythm, contrast, states, microcopy, imagery.
4. Run the anti-generic test: could this belong to any other product? If yes,
   the weakest surfaces are templates — redo them. Banned default: centered hero +
   three feature cards + testimonial row + CTA band.
5. Re-implement at least 8 concrete fixes. Log each as `before -> after`.
6. Re-verify: zero horizontal overflow at all widths, focus-visible rings,
   reduced-motion behaviour, keyboard paths, every loading/empty/error state.

## Output

A `critique.md` with the numbered fixes and fresh full-page screenshots.
