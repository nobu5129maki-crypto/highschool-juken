/**
 * GitHub Pages: 存在しないパスへのアクセス時も index を返すための SPA フォールバック。
 * https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-custom-404-page-for-your-github-pages-site
 */
import { copyFileSync, existsSync } from 'fs'
import { join } from 'path'

const dist = join(process.cwd(), 'dist')
const index = join(dist, 'index.html')
const fallback = join(dist, '404.html')

if (existsSync(index)) {
  copyFileSync(index, fallback)
  console.log('postbuild: wrote 404.html (SPA fallback)')
}
