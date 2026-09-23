---
name: screenroom-real-imagery
description: Replace CSS placeholders with real, brand-matched imagery and verify every image loads. Use whenever a build contains gradient blocks, grey boxes or icons standing in for photos, covers, avatars or product shots.
---

# Real imagery, verified

Reference screens in Screenroom are full of real photos, artwork, covers and
avatars. A build whose "images" are coloured rectangles fails the reference
test before anyone reads a word.

## Steps

1. List every image slot in the build (hero, cards, avatars, covers, product
   shots, OG image, favicon, app icon).
2. Source real assets for each: free-licence photo libraries matched to the
   brand palette, generated imagery in one consistent style, or the actual
   reference screenshots where a product screen is what the slot shows.
   Check `https://web-production-f3e51.up.railway.app/api/v1/inspiration?kind=og-image` and `kind=app-icon` for how
   shipped products brief their share cards and icons.
3. Write `assets/manifest.json`: `{ path, slot, source, licence, width, height }`
   for every file. No entry, no image.
4. Verify in the browser that every `<img>` has `naturalWidth > 0` and that the
   OG image renders at 1200x630.
5. Never fabricate metrics, logos of real companies you have no relationship
   with, or testimonials.

## Output

`assets/manifest.json` plus a one-line load report: `N/N images loaded`.
