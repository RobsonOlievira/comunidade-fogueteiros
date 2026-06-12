/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg-color)',
        surface: '#0b0520',
        primary: '#339c81',
        'primary-hover': '#2d8a72',
        'accent-cyan': '#35acb9',
        'accent-lilac': '#c09fff',
        'accent-lilac-hover': '#a88bef',
        'accent-pink': '#ff007f',
        'accent-green': '#39ff14',
        glass: 'rgba(255, 255, 255, 0.05)',
        'glass-border': 'rgba(255, 255, 255, 0.08)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Rajdhani', 'sans-serif'],
      }
    }
  },
  plugins: [],
}
