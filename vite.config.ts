import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 相対パス: GitHub Pages の /リポジトリ名/ でも、サブフォルダ名をここに合わせる必要がない。
// https://vitejs.dev/config/shared-options.html#base
export default defineConfig({
  base: './',
  plugins: [react()],
})
