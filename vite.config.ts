import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // أو اضبطه حسب نوع مشروعك، إذا كان فانيلا جاوا سكريبت اتركه فارغاً

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/jooker/', // هذا السطر هو الأهم ليعمل الموقع على GitHub Pages
})
