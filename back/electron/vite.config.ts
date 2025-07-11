import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  root: __dirname, // make sure it doesn't try to walk up
  build: {
    lib: {
      entry: path.resolve(__dirname, 'preload.ts'),
      formats: ['cjs'], // Electron needs CommonJS
      fileName: () => 'preload.js',
    },
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: false,
    rollupOptions: {
      external: ['electron', 'fs', 'path', 'os', 'url'], // don't bundle Electron APIs
      input: path.resolve(__dirname, 'preload.ts'), // ensure no index.html
    },
    target: 'node14', // safe for Electron 12+
    sourcemap: false,
    minify: false,
  },
  optimizeDeps: {
    // 🚫 Don't prebundle anything in preload
    exclude: ['electron', 'fs', 'path'],
  },
  plugins: [], // ensures no CSS plugins or Svelte/Vue by accident
})
