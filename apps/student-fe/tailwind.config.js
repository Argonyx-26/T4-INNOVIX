/** @type {import('tailwindcss').Config} */
export default {
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
      colors: {
        eduvia: {
          canvas: "#EFEFEE",
          dark: "#17171B",
          ink: "#141414",
          violet: "#8266F0",
          pink: "#EC4899",
          muted: "#6B6B6B",
        },
        adhd: {
          canvas: "#FBF2E4",
          coral: "#F1645C",
          pink: "#F5A9C4",
          teal: "#1F5C52",
          gold: "#EFC24A",
          mint: "#B9E4D0",
        },
      },
    },
  },
  plugins: [],
};
