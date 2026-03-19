/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // HYROX 官网风格：黑底 + 红色强调 (https://hyrox.com/elites/)
        hyrox: {
          red: '#E31837',      // 主强调色（官网 CTA / 品牌红）
          'red-dark': '#B8142C',
          'red-light': '#FF2D4A',
          black: '#0a0a0a',
          'gray-dark': '#141414',
          'gray-mid': '#1f1f1f',
          light: '#f5f5f5'
        }
      }
    },
  },
  plugins: [],
}
