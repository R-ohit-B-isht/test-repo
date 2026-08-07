# Apple (Human Interface Guidelines) Design System — Platform Mapping

The native platform is **SwiftUI / UIKit**, where the system supplies fonts, semantic colors, materials, and SF Symbols — so the most faithful output uses those APIs, not hardcoded values. A web (HTML/CSS) mapping and a Figma mapping follow for non-native targets.

## 1. SWIFTUI (primary)

Use semantic APIs so appearance, Dynamic Type, and accessibility work automatically.

```swift
import SwiftUI

struct AccountRow: View {
    var body: some View {
        NavigationStack {
            List {
                Section("Storage") {
                    LabeledContent("iCloud Drive", value: "38 GB")
                    LabeledContent("Photos", value: "12 GB")
                }
            }
            .navigationTitle("Account")          // Large Title → inline on scroll
            .listStyle(.insetGrouped)
        }
        .tint(.blue)                              // app-wide interactive tint
    }
}
```

Key mappings:

```swift
// Typography — Dynamic Type text styles (scale automatically), never fixed sizes
Text("Today").font(.largeTitle)                  // 34/41 at default
Text("Summary").font(.headline)                  // 17 Semibold
Text("Updated just now").font(.footnote).foregroundStyle(.secondary)
Text("v2.1.0").font(.system(.body, design: .monospaced))   // SF Mono
Text("Article").font(.system(.body, design: .serif))       // New York

// Color — semantic, appearance-adaptive
.foregroundStyle(.primary)        // label
.foregroundStyle(.secondary)      // secondaryLabel
.background(Color(.systemGroupedBackground))
.tint(.blue)                      // systemBlue interactive
Label("Delete", systemImage: "trash").foregroundStyle(.red)   // systemRed destructive

// Materials & depth (functional layer picks up Liquid Glass automatically)
.background(.regularMaterial)                    // standard content material
.background(.ultraThinMaterial)

// Shape — continuous corners + concentric nesting
.clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
Button("Continue") {}.buttonStyle(.borderedProminent).buttonBorderShape(.capsule)

// SF Symbols — weight/scale match adjacent text; choose a rendering mode
Image(systemName: "wifi").font(.body).symbolRenderingMode(.hierarchical)

// Motion — springs, and honor Reduce Motion
withAnimation(.spring(duration: 0.35)) { isExpanded.toggle() }
@Environment(\.accessibilityReduceMotion) private var reduceMotion
```

- **Buttons:** `.borderedProminent` (one per context) / `.bordered` / `.plain`; `role: .destructive` for delete.
- **Controls:** `Toggle`, `Stepper`, `Slider`, `Picker(.segmented)`, `DatePicker`, `ProgressView`, `Gauge` — all standard.
- Do not fight Dynamic Type; give layouts room to grow and test at AX sizes.

## 2. UIKIT (notes)

- Fonts: `UIFont.preferredFont(forTextStyle: .body)` with `adjustsFontForContentSizeCategory = true`.
- Colors: `UIColor.label`, `.secondaryLabel`, `.systemBackground`, `.systemGroupedBackground`, `.separator`, `.systemBlue`, `.systemRed`, `.tintColor`.
- Materials: `UIVisualEffectView(effect: UIBlurEffect(style: .systemMaterial))` + `UIVibrancyEffect`.
- Symbols: `UIImage(systemName:)` with `UIImage.SymbolConfiguration`.

## 3. HTML / CSS / WEB

On the web, use `-apple-system` / `system-ui` (renders SF on Apple browsers) with fallbacks — or `@font-face` when local SF font files are available in the project. Drive appearance with `prefers-color-scheme`. Map semantic tokens to CSS custom properties (values from `tokens.md`).

```css
:root {
  --font-ui: -apple-system, BlinkMacSystemFont, system-ui, "Helvetica Neue", Arial, sans-serif;
  --font-serif: ui-serif, "New York", Georgia, "Times New Roman", serif;
  --font-mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace;

  /* light appearance */
  --label: #000000;
  --label-secondary: rgba(60,60,67,0.60);
  --label-tertiary: rgba(60,60,67,0.30);
  --separator: rgba(60,60,67,0.29);
  --bg: #ffffff;
  --bg-grouped: #f2f2f7;
  --bg-grouped-secondary: #ffffff;
  --tint: #007aff;      /* systemBlue */
  --red: #ff3b30; --green: #34c759; --orange: #ff9500;

  --radius-control: 10px;   /* approximate continuous corners */
  --radius-card: 12px;
  --space-sm: 8px; --space-md: 16px; --space-lg: 20px; --space-xl: 24px;
  --tap: 44px;
}

@media (prefers-color-scheme: dark) {
  :root {
    --label: #ffffff;
    --label-secondary: rgba(235,235,245,0.60);
    --label-tertiary: rgba(235,235,245,0.30);
    --separator: rgba(84,84,88,0.60);
    --bg: #000000;
    --bg-grouped: #000000;
    --bg-grouped-secondary: #1c1c1e;
    --tint: #0a84ff; --red: #ff453a; --green: #30d158; --orange: #ff9f0a;
  }
}

body { font-family: var(--font-ui); color: var(--label); background: var(--bg); }

/* grouped card + hairline, not a drop shadow */
.card {
  background: var(--bg-grouped-secondary);
  border-radius: var(--radius-card);
  padding: var(--space-md);
}
.card + .card { border-top: 0.5px solid var(--separator); }

/* floating layer approximates a material */
.sheet { background: color-mix(in srgb, var(--bg) 75%, transparent);
  backdrop-filter: saturate(180%) blur(20px);
  box-shadow: 0 10px 40px rgba(0,0,0,.18); }

.button-prominent {
  background: var(--tint); color: #fff; border: none;
  min-height: var(--tap); padding: 0 20px; border-radius: 999px; /* capsule */
  font: 600 17px/1 var(--font-ui);
}

@media (prefers-reduced-motion: reduce) {
  * { animation-duration: .001ms !important; transition-duration: .001ms !important; }
}
@media (prefers-reduced-transparency: reduce) {
  .sheet { backdrop-filter: none; background: var(--bg); }
}
```

Worked example — a grouped settings row:

```html
<section class="card">
  <div class="row">
    <span class="row__label">iCloud Drive</span>
    <span class="row__value">38 GB</span>
  </div>
</section>
```
```css
.row { display:flex; justify-content:space-between; align-items:center;
  min-height: var(--tap); }
.row__label { color: var(--label); font: 17px/1.3 var(--font-ui); }        /* Body */
.row__value { color: var(--label-secondary); font: 17px/1.3 var(--font-ui); }
```

## 4. FIGMA / APPLE DESIGN RESOURCES

- Start from **Apple Design Resources** (official iOS/iPadOS/macOS UI kits, SF fonts, SF Symbols app) — don't rebuild system components by hand.
- Install the **SF Pro / SF Mono / New York** fonts (free for design work) and the **SF Symbols** app for glyphs.
- Build Figma text/color **styles/variables** mirroring the Dynamic Type text styles and semantic colors, with separate light/dark variable modes (not hand-picked hex per layer).
- Use continuous-corner shapes and the standard component metrics from the UI kits; annotate the app-wide tint.
