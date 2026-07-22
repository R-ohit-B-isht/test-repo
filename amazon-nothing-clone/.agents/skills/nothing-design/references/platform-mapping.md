# Nothing Design System — Platform Mapping

## 1. HTML / CSS / WEB

Load the actual Nothing font assets with `@font-face` or the framework's local-font loader. Use CSS custom properties, `rem` for type, `px` for spacing/borders. Dark/light via `prefers-color-scheme` or class toggle.

```css
@font-face {
  font-family: "Ndot 57";
  src: url("/fonts/NDot-57.otf") format("opentype");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: "NType 82";
  src: url("/fonts/NType82-Regular.otf") format("opentype");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
```

```css
:root {
  --black: #000000;
  --surface: #111111;
  --surface-raised: #1A1A1A;
  --border: #222222;
  --border-visible: #333333;
  --text-disabled: #666666;
  --text-secondary: #999999;
  --text-primary: #E8E8E8;
  --text-display: #FFFFFF;
  --accent: #D71921;
  --accent-subtle: rgba(215,25,33,0.15);
  --success: #4A9E5C;
  --warning: #D4A843;
  --interactive: #5B9BF6;
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  --space-3xl: 64px;
  --space-4xl: 96px;
}
```

---

## 2. SWIFTUI / iOS

Register fonts in Info.plist, bundle licensed `.otf` files. Use `@Environment(\.colorScheme)` for mode switching.

```swift
extension Color {
    static let ndBlack = Color(hex: "000000")
    static let ndSurface = Color(hex: "111111")
    static let ndSurfaceRaised = Color(hex: "1A1A1A")
    static let ndBorder = Color(hex: "222222")
    static let ndBorderVisible = Color(hex: "333333")
    static let ndTextDisabled = Color(hex: "666666")
    static let ndTextSecondary = Color(hex: "999999")
    static let ndTextPrimary = Color(hex: "E8E8E8")
    static let ndTextDisplay = Color.white
    static let ndAccent = Color(hex: "D71921")
    static let ndSuccess = Color(hex: "4A9E5C")
    static let ndWarning = Color(hex: "D4A843")
    static let ndInteractive = Color(hex: "5B9BF6")
}
```

Light mode values in tokens.md Dark/Light table. Derive Font extension from font stack table (trivial: `.custom("Ndot 57"/"NType 82", size:)`).

---

## 3. PAPER (DESIGN TOOL)

Use the design tool's font inspection APIs to verify `Ndot 57` and `NType 82` before writing styles. Direct hex values (no CSS variables). Dark mode as default canvas, light mode as separate artboard.
