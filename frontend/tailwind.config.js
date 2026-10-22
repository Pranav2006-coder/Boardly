/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // === BURGUNDY & CREAM DESIGN SYSTEM ===
        // Primary brand: Deep Burgundy
        "primary":                   "#7F1D3F",
        "primary-hover":             "#651630",
        "primary-container":         "#FFF8F0",
        "on-primary":                "#FFFFFF",
        "on-primary-container":      "#651630",
        "primary-fixed":             "#E8B7C2",
        "primary-fixed-dim":         "#A63D57",
        "on-primary-fixed":          "#4A0E23",
        "on-primary-fixed-variant":  "#651630",
        "inverse-primary":           "#E8B7C2",

        // Secondary burgundy & soft rose
        "secondary":                 "#A63D57",
        "secondary-container":       "#FFF8F0",
        "on-secondary":              "#FFFFFF",
        "on-secondary-container":    "#4A0E23",
        "secondary-fixed":           "#E8B7C2",
        "secondary-fixed-dim":       "#C97086",

        // Tertiary / Rose accent
        "tertiary":                  "#E8B7C2",
        "tertiary-container":        "#FFF8F0",
        "on-tertiary":               "#4A0E23",
        "on-tertiary-container":     "#651630",

        // === BURGUNDY & CREAM LIGHT BACKGROUNDS & NEUTRALS ===
        "background":                "#FAF6F2",
        "on-background":             "#292323",

        "surface":                   "#FAF6F2",
        "surface-dim":               "#F3EDE7",
        "surface-bright":            "#FFFFFF",
        "surface-variant":           "#FFF8F0",
        "on-surface":                "#292323",
        "on-surface-variant":        "#786C6C",
        "surface-tint":              "#7F1D3F",

        "surface-container-lowest":  "#FFFFFF",
        "surface-container-low":     "#FAF6F2",
        "surface-container":         "#FFF8F0",
        "surface-container-high":    "#E8DDD8",
        "surface-container-highest": "#D6CECA",

        "inverse-surface":           "#292323",
        "inverse-on-surface":        "#FAF6F2",

        "outline":                   "#D6CECA",
        "outline-variant":           "#E8DDD8",

        // Dark Canvas Controls Surface
        "canvas-dark":               "#292524",
        "canvas-dark-subtle":        "#1C1917",

        "error":                     "#DC2626",
        "error-container":           "#FEE2E2",
        "on-error":                  "#FFFFFF",
        "on-error-container":        "#7F1D1D",
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg":      "0.5rem",
        "xl":      "0.75rem",
        "2xl":     "1rem",
        "3xl":     "1.5rem",
        "full":    "9999px"
      },
      spacing: {
        "space-xs":        "0.25rem",
        "space-sm":        "0.5rem",
        "space-md":        "1rem",
        "space-lg":        "1.5rem",
        "space-xl":        "2rem",
        "gutter":          "1rem",
        "gutter-mobile":   "0.5rem",
        "gutter-tablet":   "0.75rem",
        "margin":          "1.5rem",
        "margin-mobile":   "0.75rem",
        "margin-tablet":   "1rem"
      },
      fontFamily: {
        sans:           ["Inter", "sans-serif"],
        headline:       ["Plus Jakarta Sans", "sans-serif"],
        "headline-sm":  ["Plus Jakarta Sans", "sans-serif"],
        "headline-md":  ["Plus Jakarta Sans", "sans-serif"],
        "headline-lg":  ["Plus Jakarta Sans", "sans-serif"],
        "headline-xl":  ["Plus Jakarta Sans", "sans-serif"],
        "body-sm":      ["Inter", "sans-serif"],
        "body-md":      ["Inter", "sans-serif"],
        "body-lg":      ["Inter", "sans-serif"],
        "label-sm":     ["Inter", "sans-serif"],
        "label-md":     ["Inter", "sans-serif"],
        "label-lg":     ["Inter", "sans-serif"]
      }
    },
  },
  plugins: [],
}
