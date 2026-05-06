/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Rajdhani', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace'],
        display: ['Orbitron', 'sans-serif'],
      },
      colors: {
        terran: '#00d4ff',
        terranDark: '#003a4d',
        protoss: '#ff8c00',
        protossDark: '#663800',
        void: '#030303',
      },
    },
  },
  plugins: [],
}
