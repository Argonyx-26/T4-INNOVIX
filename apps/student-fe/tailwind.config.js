/** @type {import('tailwindcss').Config} */
export default {
  // The Eduvia theme is light-only (artwork has light backgrounds). "class" mode means dark:
  // variants apply only if a "dark" class is added, which the app never does.
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["Fraunces", "serif"],
        sans: ["'DM Sans'", "sans-serif"],
        dyslexic: ["Lexend", "'OpenDyslexic'", "sans-serif"],
      },
      // Theme tokens backed by CSS variables in src/index.css; ADHD mode swaps their values.
      colors: {
        canvas: "rgb(var(--c-canvas) / <alpha-value>)",
        sidebar: "rgb(var(--c-sidebar) / <alpha-value>)",
        fill: "rgb(var(--c-fill) / <alpha-value>)",
        "fill-2": "rgb(var(--c-fill-2) / <alpha-value>)",
        "fill-hover": "rgb(var(--c-fill-hover) / <alpha-value>)",
        brand: "rgb(var(--c-brand) / <alpha-value>)",
        "brand-strong": "rgb(var(--c-brand-strong) / <alpha-value>)",
        "brand-ink": "rgb(var(--c-brand-ink) / <alpha-value>)",
        "brand-soft": "rgb(var(--c-brand-soft) / <alpha-value>)",
        "brand-faint": "rgb(var(--c-brand-faint) / <alpha-value>)",
        nav: "rgb(var(--c-nav) / <alpha-value>)",
        "nav-ink": "rgb(var(--c-nav-ink) / <alpha-value>)",
      },
    },
  },
  plugins: [],
};
