import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    global: 'globalThis',
    'process.env': '{}',
  },
  server: {
    port: 5174,
    allowedHosts: ['*'],
  },
  publicDir: false,
  build: {
    outDir: 'www',
    emptyOutDir: false,
  },
})
