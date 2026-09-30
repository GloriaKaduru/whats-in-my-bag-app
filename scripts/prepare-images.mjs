/**
 * Turns the raw cut-out photos into web-ready assets:
 *   trim transparent padding → resize → WebP → public/images/
 *
 * The two bag photos are also placed on one shared canvas (bottom-aligned,
 * scaled to the same width) so crossfading closed → open doesn't jump.
 *
 * Usage:  npm run images -- "C:\path\to\photos"   (defaults to ~/Pictures)
 */
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

const SRC = process.argv[2] ?? join(homedir(), 'Pictures')
const OUT = join(import.meta.dirname, '..', 'public', 'images')

/** source file name (without .png) → output slug */
const OBJECTS = {
  'Nysc id': 'nysc-id',
  'nysc card': 'cds-card',
  'house keys': 'keys',
  'tiny purse': 'makeup-purse',
  'work laptop': 'laptop',
  passport: 'passport',
  cash: 'cash',
  'Oraimo SpaceBuds': 'earbuds',
  'hand cream': 'hand-cream',
  powerbank: 'power-bank',
}

const OBJECT_MAX = 900 // px on the longest side — ~2× the largest on-screen size
const BAG_WIDTH = 1000

const trimmed = (file) => sharp(join(SRC, file)).trim({ threshold: 8 }).png().toBuffer({ resolveWithObject: true })

async function objects() {
  const report = {}
  for (const [name, slug] of Object.entries(OBJECTS)) {
    const { data } = await trimmed(`${name}.png`)
    const out = join(OUT, 'objects', `${slug}.webp`)
    const info = await sharp(data)
      .resize(OBJECT_MAX, OBJECT_MAX, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82, alphaQuality: 90, effort: 6 })
      .toFile(out)
    report[slug] = { width: info.width, height: info.height, kb: Math.round(info.size / 1024) }
  }
  return report
}

async function bags() {
  const closed = await trimmed('bag closed.png')
  const open = await trimmed('bag open.png')
  const W = BAG_WIDTH
  const H = Math.round((closed.info.height / closed.info.width) * W)
  const closedBuf = await sharp(closed.data).resize(W, H).png().toBuffer()
  // Open bag: same width as the closed one, sitting on the same baseline.
  const openH = Math.round((open.info.height / open.info.width) * W)
  const openBuf = await sharp(open.data).resize(W, openH).png().toBuffer()
  const canvas = { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }

  const save = (buf, top, file) =>
    sharp({ create: canvas })
      .composite([{ input: buf, top, left: 0 }])
      .webp({ quality: 84, alphaQuality: 90, effort: 6 })
      .toFile(join(OUT, file))

  const a = await save(closedBuf, 0, 'bag-closed.webp')
  const b = await save(openBuf, H - openH, 'bag-open.webp')
  return {
    width: W,
    height: H,
    aspect: +(H / W).toFixed(4),
    // Where the open bag's rim sits, as a fraction of the height.
    openTop: +((H - openH) / H).toFixed(4),
    kb: [Math.round(a.size / 1024), Math.round(b.size / 1024)],
  }
}

await mkdir(join(OUT, 'objects'), { recursive: true })
console.log(JSON.stringify({ bag: await bags(), objects: await objects() }, null, 2))
