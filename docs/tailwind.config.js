/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./theme.config.jsx",
    "./style.css",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["var(--next-font-google-crimson-pro)", "serif"],
      },
      fontSize: {
        "2xs": ["0.625rem", "0.75rem"],
      },
    },
  },
  plugins: [],
  darkMode: "class",
};
