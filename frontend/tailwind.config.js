/** @type {import('tailwindcss').Config} */
export default {
  // QUAN TRỌNG: `relative: true` khiến Tailwind resolve các đường dẫn content
  // theo thư mục chứa file config này (frontend/) thay vì theo thư mục chạy lệnh
  // build (repo root). Build monorepo (`vite build frontend` / `tsx server.ts`)
  // chạy từ gốc repo nên nếu thiếu `relative` Tailwind sẽ không quét được
  // index.html + src/** -> mất TOÀN BỘ CSS utility (chỉ còn preflight).
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
