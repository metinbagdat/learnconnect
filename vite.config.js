import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    },
    dedupe: ['firebase']
  },
  optimizeDeps: {
    include: ['firebase', 'firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/analytics']
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
