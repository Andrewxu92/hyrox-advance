/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hyrox: {
          orange: '#FF6B35',
          black: '#1A1A1A',
          gray: '#2D2D2D',
          light: '#F5F5F5'
        }
      }
    },
  },
  plugins: [],
}
