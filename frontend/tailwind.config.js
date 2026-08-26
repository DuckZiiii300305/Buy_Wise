/** @type {import('tailwindcss').Config} */
export default {
  // `relative: true` giúp Tailwind resolve các đường dẫn content theo vị trí
  // tailwind.config.js (frontend/) thay vì theo thư mục chạy lệnh build — khắc phục
  // việc AI Studio build từ thư mục gốc repo làm mất toàn bộ CSS utility.
  content: {
    relative: true,
    files: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
  },
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
