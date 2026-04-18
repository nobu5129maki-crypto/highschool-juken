import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages は /リポジトリ名/ で配信される。白画面になる場合はこことリポジトリ名を一致させる。
// https://vitejs.dev/config/shared-options.html#base
export default defineConfig({
  base: '/highschool-juken/',
  plugins: [react()],
})
