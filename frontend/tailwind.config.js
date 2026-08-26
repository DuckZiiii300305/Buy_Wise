/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          500: '#0066ff',
          600: '#0052cc',
          700: '#003d99',
          900: '#091e42',
        },
        verdict: {
          buy: '#10b981',
          wait: '#f59e0b',
          skip: '#ef4444',
          alt: '#6366f1',
        }
      }
    },
  },
  plugins: [],
}
