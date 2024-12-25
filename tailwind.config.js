/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./popup.tsx",
    ".plasmo/**/*.{html,js,jsx,ts,tsx}"
  ],
  darkMode: "class",
  theme: {
    extend: {
      animation: {
        "spin-slow": "spin 2s linear infinite"
      }
    }
  },
  plugins: []
}
