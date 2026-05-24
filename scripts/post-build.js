/**
 * post-build.js — runs after `expo export --platform web`
 *
 * 1. Copies fav-icon.ico → dist/favicon.ico
 * 2. Injects <link rel="icon"> + correct <title> into dist/index.html
 *    (Expo metro bundler generates its own index.html, ignoring web/index.html)
 */

const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const distDir = path.join(root, 'dist')
const srcIco = path.join(root, 'fav-icon.ico')
const destIco = path.join(distDir, 'favicon.ico')
const indexHtml = path.join(distDir, 'index.html')

// 1. Copy favicon
if (fs.existsSync(srcIco)) {
  fs.copyFileSync(srcIco, destIco)
  console.log('✓ Copied fav-icon.ico → dist/favicon.ico')
} else {
  console.warn('⚠ fav-icon.ico not found, skipping favicon copy')
}

// 2. Patch index.html
if (fs.existsSync(indexHtml)) {
  let html = fs.readFileSync(indexHtml, 'utf8')

  // Inject favicon link after viewport meta if not already present
  if (!html.includes('rel="icon"')) {
    html = html.replace(
      /(<meta name="viewport"[^>]*\/>)/,
      '$1\n    <link rel="icon" type="image/x-icon" href="/favicon.ico" />'
    )
  }

  // Fix title
  html = html.replace(
    /<title>Throttlist<\/title>/,
    '<title>Throttlist - Show off your Build!</title>'
  )

  fs.writeFileSync(indexHtml, html, 'utf8')
  console.log('✓ Patched dist/index.html (favicon link + title)')
} else {
  console.error('✗ dist/index.html not found')
  process.exit(1)
}
