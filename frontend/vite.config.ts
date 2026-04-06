import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 3000,
    allowedHosts: [
      'contributed-surfaces-update-elephant.trycloudflare.com',
      '.trycloudflare.com',
      'localhost',
    ],
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
