import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    // No extra plugins needed here.
  },
  preload: {
    // No extra plugins needed here.
  },
  renderer: {
    resolve: {
      alias: {
        // This lets you use '@renderer' as a shortcut in your code
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react()]
  }
})
