import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/house-calculator/', // Đổi thành tên repo của bạn trên GitHub
})
