/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1A2B3C',
        secondary: '#f97316',
        tertiary: '#F4F7F9',
        accent: '#F7931E',
      },
    },
  },
  plugins: [],
}
