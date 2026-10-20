import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {offlineBuildPlugin} from './scripts/offline-build-plugin.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({command,isPreview,mode})=>({
  base: mode==='android' ? '/' : (command==='build'||isPreview)&&process.env.GITHUB_ACTIONS ? '/-BOKS-ANTRENMAN/' : '/',
  plugins: [react(),offlineBuildPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: mode==='android'?'dist-android':'dist',
    target: mode==='android'?'chrome90':undefined,
    sourcemap: mode!=='android',
  },
}))
