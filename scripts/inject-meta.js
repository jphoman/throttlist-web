const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

// Copy public/favicon.svg → dist/favicon.svg
fs.copyFileSync(
  path.join(__dirname, '../public/favicon.svg'),
  path.join(__dirname, '../dist/favicon.svg')
)
console.log('✓ favicon.svg copied to dist/')

// ── PNG generator (pure Node, no deps) ─────────────────────────────────────

function crc32(buf) {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[i] = c
  }
  let crc = 0xffffffff
  for (const b of buf) crc = t[(crc ^ b) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const tb = Buffer.from(type, 'ascii')
  const lb = Buffer.alloc(4); lb.writeUInt32BE(data.length)
  const cb = Buffer.alloc(4); cb.writeUInt32BE(crc32(Buffer.concat([tb, data])))
  return Buffer.concat([lb, tb, data, cb])
}

function makePNG(size, pixelFn) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 2  // 8-bit RGB
  const rows = []
  for (let y = 0; y < size; y++) {
    rows.push(0) // filter: None
    for (let x = 0; x < size; x++) rows.push(...pixelFn(x, y))
  }
  const idat = zlib.deflateSync(Buffer.from(rows), { level: 9 })
  return Buffer.concat([
    Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ── Bolt rasterizer ─────────────────────────────────────────────────────────
// Approximates the Throttlist bolt as a filled polygon at any icon size.
// Points are normalized to [0,1] coordinates derived from the 144×144 SVG.

const BOLT_POLY = [
  // Outer hull of the bolt path, traced as a simple polygon (normalized 0–1)
  [0.96, 0.44],  // top-right tip
  [0.67, 0.44],  // right edge where top cluster ends
  [0.69, 0.36],  // top inner notch
  [0.57, 0.44],  // left of top cluster
  [0.04, 0.62],  // left-most extent (far left spike)
  [0.21, 0.56],  // left inner edge
  [0.19, 0.62],  // bottom inner left
  [0.28, 0.58],  // step
  [0.43, 0.58],  // center-left
  [0.40, 0.66],  // center dip
  [0.56, 0.58],  // center-right
  [0.96, 0.44],  // close back to start
]

function pointInPoly(px, py, poly) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j]
    if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

function boltPixel(x, y, size) {
  const nx = (x + 0.5) / size
  const ny = (y + 0.5) / size
  // Red circle background
  const dx = nx - 0.5, dy = ny - 0.5
  if (dx * dx + dy * dy > 0.25) return [0, 0, 0] // transparent → black outside
  // White bolt
  if (pointInPoly(nx, ny, BOLT_POLY)) return [255, 255, 255]
  return [220, 0, 0] // red circle fill
}

// ── ICO writer ──────────────────────────────────────────────────────────────
// Modern ICO format allows embedding PNG data directly.

function makeICO(pngs) {
  // pngs: array of { size, data }
  const n = pngs.length
  const headerSize = 6 + n * 16
  const offsets = []
  let offset = headerSize
  for (const { data } of pngs) { offsets.push(offset); offset += data.length }

  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)  // reserved
  header.writeUInt16LE(1, 2)  // type: ICO
  header.writeUInt16LE(n, 4)  // count

  const entries = pngs.map(({ size, data }, i) => {
    const e = Buffer.alloc(16)
    e[0] = size === 256 ? 0 : size  // width (0 = 256)
    e[1] = size === 256 ? 0 : size  // height
    e[2] = 0  // colors in palette
    e[3] = 0  // reserved
    e.writeUInt16LE(1, 4)   // color planes
    e.writeUInt16LE(32, 6)  // bits per pixel
    e.writeUInt32LE(data.length, 8)
    e.writeUInt32LE(offsets[i], 12)
    return e
  })

  return Buffer.concat([header, ...entries, ...pngs.map(p => p.data)])
}

// ── Generate favicon.ico ────────────────────────────────────────────────────

const sizes = [16, 32, 48]
const pngs = sizes.map(size => ({
  size,
  data: makePNG(size, (x, y) => boltPixel(x, y, size)),
}))
const icoPath = path.join(__dirname, '../dist/favicon.ico')
fs.writeFileSync(icoPath, makeICO(pngs))
console.log('✓ favicon.ico generated (16×16, 32×32, 48×48)')

// ── Patch index.html ────────────────────────────────────────────────────────

const htmlPath = path.join(__dirname, '../dist/index.html')
let html = fs.readFileSync(htmlPath, 'utf8')

const meta = `
    <meta name="description" content="Show off your build. Connect with the car community." />
    <meta property="og:title" content="Throttlist - Show off your Build!" />
    <meta property="og:description" content="Show off your build. Connect with the car community." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://throttlist.com" />
    <meta property="og:image" content="https://throttlist.com/og-image.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Throttlist - Show off your Build!" />
    <meta name="twitter:description" content="Show off your build. Connect with the car community." />
    <meta name="twitter:image" content="https://throttlist.com/og-image.png" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />`

html = html.replace(/<title>[^<]*<\/title>/, '<title>Throttlist - Show off your Build!</title>')
html = html.replace('</head>', `${meta}\n  </head>`)

fs.writeFileSync(htmlPath, html)
console.log('✓ Meta tags + SVG favicon link injected into dist/index.html')
