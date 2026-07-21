/**
 * Renders the tulip motif to the PNG icons the web app manifest needs.
 *
 * Android insists on real PNGs (SVG manifest icons are still patchy), and iOS wants an
 * apple-touch-icon. Rather than add an image library for four files, this rasterises the
 * same path the Vue component uses — `zlib` is built into Node, and a PNG is little more
 * than a deflated bitmap.
 *
 * Run with `pnpm icons` after changing the motif.
 */
import { deflateSync } from 'node:zlib'
import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const PAPER = [0xfa, 0xf4, 0xe8] // --color-linen-50
const MADDER = [0xb4, 0x23, 0x1f] // --color-madder-500

/** The tulip, as quadratic segments in a 24×24 viewBox — identical to FolkTulip.vue. */
const SEGMENTS = [
  [
    [5.2, 7.4],
    [9.0, 10.8],
    [10.4, 7.2],
  ], // left petal tip, dipping into the notch
  [
    [10.4, 7.2],
    [12, 3.8],
    [13.6, 7.2],
  ], // centre petal, taller
  [
    [13.6, 7.2],
    [15.0, 10.8],
    [18.8, 7.4],
  ], // right petal tip
  [
    [18.8, 7.4],
    [19.4, 14.2],
    [15.8, 17.2],
  ], // body, tapering
  // Base: softened to a curve but still meeting in a soft point, not a bowl. The control
  // points here are collinear with the ones above, or the joint shows as a corner.
  [
    [15.8, 17.2],
    [14.5, 18.3],
    [12, 19.8],
  ],
  [
    [12, 19.8],
    [9.5, 18.3],
    [8.2, 17.2],
  ],
  [
    [8.2, 17.2],
    [4.6, 14.2],
    [5.2, 7.4],
  ],
]

/** Flatten the curves into a polygon we can hit-test. */
function outline() {
  const points = []
  for (const [p0, p1, p2] of SEGMENTS) {
    for (let t = 0; t < 1; t += 0.002) {
      const u = 1 - t
      points.push([
        u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
        u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
      ])
    }
  }
  return points
}

/**
 * Scanline fill with vertical supersampling and exact horizontal coverage.
 *
 * Testing every pixel against every edge is ~6 billion operations at 512px; walking
 * scanlines and filling spans is a few hundred thousand.
 *
 * @param size    pixel width/height
 * @param content how much of the canvas the tulip fills (maskable icons need a safe zone)
 */
function render(size, content) {
  const points = outline()
  const xs = points.map((p) => p[0])
  const ys = points.map((p) => p[1])
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  const scale = (size * content) / Math.max(maxX - minX, maxY - minY)
  const offsetX = size / 2 - ((minX + maxX) / 2) * scale
  const offsetY = size / 2 - ((minY + maxY) / 2) * scale

  // Project the outline into device pixels once.
  const poly = points.map(([x, y]) => [x * scale + offsetX, y * scale + offsetY])

  const SUB = 4 // subsample rows per pixel row
  const coverage = new Float32Array(size * size)
  const crossings = []

  for (let sy = 0; sy < size * SUB; sy++) {
    const y = (sy + 0.5) / SUB
    crossings.length = 0

    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i]
      const [xj, yj] = poly[j]
      if (yi > y !== yj > y) crossings.push(((xj - xi) * (y - yi)) / (yj - yi) + xi)
    }
    if (crossings.length < 2) continue
    crossings.sort((a, b) => a - b)

    const row = Math.floor(y) * size
    for (let k = 0; k + 1 < crossings.length; k += 2) {
      const from = Math.max(crossings[k], 0)
      const to = Math.min(crossings[k + 1], size)
      if (to <= from) continue

      for (let px = Math.floor(from); px < Math.ceil(to); px++) {
        // Exact overlap of the span with this pixel column.
        const overlap = Math.min(to, px + 1) - Math.max(from, px)
        if (overlap > 0) coverage[row + px] += overlap / SUB
      }
    }
  }

  const pixels = Buffer.alloc(size * size * 3)
  for (let i = 0; i < size * size; i++) {
    const alpha = Math.min(coverage[i], 1)
    for (let channel = 0; channel < 3; channel++) {
      pixels[i * 3 + channel] = Math.round(PAPER[channel] * (1 - alpha) + MADDER[channel] * alpha)
    }
  }
  return pixels
}

// ── Minimal PNG writer (8-bit RGB, no interlacing) ──────────────────────────────
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

function crc32(buffer) {
  let c = 0xffffffff
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([length, body, crc])
}

function toPng(pixels, size) {
  const header = Buffer.alloc(13)
  header.writeUInt32BE(size, 0)
  header.writeUInt32BE(size, 4)
  header[8] = 8 // bit depth
  header[9] = 2 // colour type: truecolour RGB
  // bytes 10-12 stay 0: deflate, adaptive filtering, no interlace

  // Each scanline is prefixed with its filter type (0 = none).
  const raw = Buffer.alloc(size * (size * 3 + 1))
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0
    pixels.copy(raw, y * (size * 3 + 1) + 1, y * size * 3, (y + 1) * size * 3)
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const icons = [
  ['icon-192.png', 192, 0.62],
  ['icon-512.png', 512, 0.62],
  // Android crops maskable icons to a circle, so the tulip has to sit well inside.
  ['icon-maskable-512.png', 512, 0.46],
  ['apple-touch-icon.png', 180, 0.62],
]

await mkdir(resolve(root, 'public'), { recursive: true })
for (const [name, size, content] of icons) {
  const png = toPng(render(size, content), size)
  await writeFile(resolve(root, 'public', name), png)
  console.log(`[icons] ${name} — ${size}×${size}, ${(png.length / 1024).toFixed(1)} kB`)
}
