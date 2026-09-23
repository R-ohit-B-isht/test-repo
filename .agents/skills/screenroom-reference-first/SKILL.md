---
name: screenroom-reference-first
description: Research real shipped product screens in Screenroom before designing any surface. Use before building a landing page, dashboard, onboarding, pricing, settings or any app screen.
---

# Reference-first design with Screenroom

Never design from memory. Pull real references from the Screenroom library, name
the craft moves they make, and only then design.

## Steps

1. Read `https://web-production-f3e51.up.railway.app/llms.txt` and `https://web-production-f3e51.up.railway.app/api/v1/taxonomy` for valid filter values.
2. For EACH major surface you will build, fetch its curated collection:
   `https://web-production-f3e51.up.railway.app/api/v1/curated/{slug}` (e.g. `landing-hero`, `pricing`, `app-dashboard`,
   `onboarding`, `settings`, `empty-state`). Add `?category=` to keep the genre tight.
3. Search the inspiration feed for the visual register you are after:
   `https://web-production-f3e51.up.railway.app/api/v1/inspiration?kind=website&style=Dark&type=SaaS` — every item links to
   the app's real screens, flows and measured design tokens.
4. Open at least 12 screenshot URLs. For each, write 2-3 named craft moves
   (layout grid, type scale, colour usage, spacing rhythm, density, states).
5. Pull `designTokens` for the 2-3 apps you admire (`/api/v1/apps/{slug}`) and use
   the measured values as anchors — never guess font sizes, radii or button colours.
6. Write a reference matrix before implementing: which reference anchors which
   section, which moves you lift, and why.

## Output

A `research-log.md` containing: queries run, references chosen (by app + screen
title), the reference matrix, measured tokens, and what the library lacked.
