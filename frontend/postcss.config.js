import { fileURLToPath } from 'node:url';

// Trỏ Tailwind tới đúng config bằng đường dẫn TUYỆT ĐỐI, bất kể lệnh build chạy
// từ thư mục nào (repo root hay frontend/). Tailwind v3 resolve `tailwind.config.js`
// theo cwd nên khi build monorepo từ gốc repo (vite build frontend / Vite middleware
// trong server.ts) nó không tìm thấy config -> mất toàn bộ CSS utility.
export default {
  plugins: {
    tailwindcss: { config: fileURLToPath(new URL('./tailwind.config.js', import.meta.url)) },
    autoprefixer: {},
  },
};