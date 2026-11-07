/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/** Lo mínimo del proxy de desarrollo que se usa aquí, sin depender de los tipos de Node. */
type ProxyConEventos = {
  on: (evento: 'proxyReq', manejador: (peticion: { removeHeader: (nombre: string) => void }) => void) => void
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/v1/auth': {
        target: 'https://g7-auth-service.onrender.com',
        changeOrigin: true,
        secure: false,
        // G7 responde 403 a peticiones con Origin localhost; el proxy local no debe reenviarlo.
        configure: (proxy) => {
          const emisor = proxy as unknown as ProxyConEventos
          emisor.on('proxyReq', (peticion) => peticion.removeHeader('origin'))
        },
      },
    },
  },
  test: { environment: 'node' },
})
