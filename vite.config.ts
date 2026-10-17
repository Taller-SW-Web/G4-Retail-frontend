/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/v1/auth': {
        target: 'https://g7-auth-service.onrender.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  test: { environment: 'node' },
})
