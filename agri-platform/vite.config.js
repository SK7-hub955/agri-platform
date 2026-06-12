import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: false,
    target: 'esnext'
  },
  server: {
    port: 5173,
    host: '0.0.0.0'
  }
})
