/** @type {import('tailwindcss').Config} */
// Nothing design system tokens are exposed as CSS custom properties in
// src/index.css and referenced here so dark/light mode switch by toggling a
// single [data-theme] attribute on <html>. See .agents/skills/nothing-design.
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    // Fixed 4-level gray scale + red interrupt. No arbitrary extra colors.
    colors: {
      transparent: "transparent",
      current: "currentColor",
      black: "var(--black)",
      surface: "var(--surface)",
      "surface-raised": "var(--surface-raised)",
      border: "var(--border)",
      "border-visible": "var(--border-visible)",
      "text-disabled": "var(--text-disabled)",
      "text-secondary": "var(--text-secondary)",
      "text-primary": "var(--text-primary)",
      "text-display": "var(--text-display)",
      accent: "var(--accent)",
      "accent-subtle": "var(--accent-subtle)",
      success: "var(--success)",
      warning: "var(--warning)",
      interactive: "var(--interactive)",
    },
    // 8px base spacing scale from tokens.md Section 3.
    spacing: {
      0: "0px",
      "2xs": "2px",
      xs: "4px",
      sm: "8px",
      md: "16px",
      lg: "24px",
      xl: "32px",
      "2xl": "48px",
      "3xl": "64px",
      "4xl": "96px",
      px: "1px",
    },
    borderRadius: {
      none: "0px",
      technical: "4px",
      sm: "8px",
      md: "12px",
      lg: "16px",
      pill: "999px",
    },
    extend: {
      fontFamily: {
        // Body / UI / data — monospace fallback for the licensed "NType 82".
        body: ['"NType 82"', '"SF Mono"', "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        // Hero display — bold condensed/mono fallback for the licensed "Ndot 57".
        display: ['"Ndot 57"', '"NType 82"', '"SF Mono"', "ui-monospace", "monospace"],
      },
      fontSize: {
        // Type scale — one large / one medium / one small per screen budget.
        "display-xl": ["72px", { lineHeight: "1.0", letterSpacing: "-0.03em" }],
        "display-lg": ["48px", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        "display-md": ["36px", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        heading: ["24px", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
        subheading: ["18px", { lineHeight: "1.3", letterSpacing: "0" }],
        body: ["16px", { lineHeight: "1.5", letterSpacing: "0" }],
        "body-sm": ["14px", { lineHeight: "1.5", letterSpacing: "0.01em" }],
        caption: ["12px", { lineHeight: "1.4", letterSpacing: "0.04em" }],
        label: ["11px", { lineHeight: "1.2", letterSpacing: "0.08em" }],
      },
      transitionTimingFunction: {
        // Subtle ease-out only. No spring / bounce (anti-pattern).
        nothing: "cubic-bezier(0.25, 0.1, 0.25, 1)",
      },
    },
  },
  plugins: [],
};
