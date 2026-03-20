/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "var(--primary)",
          "primary-hover": "var(--primary-hover)",
          secondary: "var(--secondary)",
          "secondary-hover": "var(--secondary-hover)",

          surface: "var(--bg-primary)",
          layer: "var(--bg-secondary)",
          overlay: "var(--bg-tertiary)",

          heading: "var(--text-primary)",
          body: "var(--text-secondary)",
          muted: "var(--text-tertiary)",

          border: "var(--border-color)",
          "border-light": "var(--border-light)",
        },
      },
      boxShadow: {
        brand: "var(--shadow)",
        "brand-hover": "var(--shadow-hover)",
      },
      fontFamily: {
        sans: ["Space Grotesk", "sans-serif"],
        serif: ["Fraunces", "serif"],
      },
    },
  },
  plugins: [],
};
