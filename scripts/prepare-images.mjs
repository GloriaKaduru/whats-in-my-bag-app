/**
 * Turns the raw cut-out photos into web-ready assets:
 *   trim transparent padding → resize → WebP → public/images/
 *
 * The two bag photos are also placed on one shared canvas (bottom-aligned,
 * scaled to the same width) so crossfading closed → open doesn't jump.
 *
 * Every source is optional: anything missing from the folder is skipped, so
 * you can regenerate just the cursors or just the purse contents.
 *
 * Usage:  npm run images -- "C:\path\to\photos"   (defaults to ~/Pictures)
 */
import sharp from 'sharp'
import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

const SRC = process.argv[2] ?? join(homedir(), 'Pictures')
const PUBLIC = join(import.meta.dirname, '..', 'public')
const OUT = join(PUBLIC, 'images')

/** source file name (without extension) → output slug */
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

/** What spills out of the makeup purse on hover. */
const PURSE = {
  'lip tint': 'lip-tint',
  'lip gloss': 'lip-gloss',
  'lip liner': 'lip-liner',
}

/**
 * Areas to blur before publishing, as fractions of the finished image
 * (x, y, width, height). Keeps faces, names and ID numbers unreadable.
 */
const REDACT = {
  'nysc-id': [
    [0.469, 0.731, 0.145, 0.151], // photo + signature
    [0.611, 0.753, 0.274, 0.136], // name, state code, details
    [0.766, 0.896, 0.12, 0.022], // validity date
  ],
}

const OBJECT_MAX = 900 // px on the longest side — ~2× the largest on-screen size
const PURSE_MAX = 400
const BAG_WIDTH = 1000
const HAND_WIDTH = 160 // ~3× the on-screen cursor width
const INK = { r: 67, g: 48, b: 46 } // Old Burgundy, used for every shadow

const EXTS = ['png', 'webp', 'jpg', 'jpeg']
const find = (name) => EXTS.map((e) => join(SRC, `${name}.${e}`)).find(existsSync)

const trimmed = (file) => sharp(file).trim({ threshold: 8 }).png().toBuffer({ resolveWithObject: true })

const webp = (img, file) => img.webp({ quality: 82, alphaQuality: 90, effort: 6 }).toFile(file)

async function redact(buf, regions) {
  const { width, height } = await sharp(buf).metadata()
  const patches = await Promise.all(
    regions.map(async ([x, y, w, h]) => {
      const box = {
        left: Math.round(x * width),
        top: Math.round(y * height),
        width: Math.round(w * width),
        height: Math.round(h * height),
      }
      const input = await sharp(buf).extract(box).blur(Math.max(6, width * 0.012)).toBuffer()
      return { input, left: box.left, top: box.top }
    }),
  )
  return sharp(buf).composite(patches).png().toBuffer()
}

async function cutouts(map, dir, max) {
  const report = {}
  await mkdir(join(OUT, dir), { recursive: true })
  for (const [name, slug] of Object.entries(map)) {
    const file = find(name)
    if (!file) continue
    const { data } = await trimmed(file)
    let buf = await sharp(data).resize(max, max, { fit: 'inside', withoutEnlargement: true }).png().toBuffer()
    if (REDACT[slug]) buf = await redact(buf, REDACT[slug])
    const info = await webp(sharp(buf), join(OUT, dir, `${slug}.webp`))
    report[slug] = { width: info.width, height: info.height, kb: Math.round(info.size / 1024) }
  }
  return report
}

async function bags() {
  const closedFile = find('bag closed')
  const openFile = find('bag open')
  if (!closedFile || !openFile) return 'skipped'
  const closed = await trimmed(closedFile)
  const open = await trimmed(openFile)
  const W = BAG_WIDTH
  const H = Math.round((closed.info.height / closed.info.width) * W)
  const closedBuf = await sharp(closed.data).resize(W, H).png().toBuffer()
  // Open bag: same width as the closed one, sitting on the same baseline.
  const openH = Math.round((open.info.height / open.info.width) * W)
  const openBuf = await sharp(open.data).resize(W, openH).png().toBuffer()
  const canvas = { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }

  const save = (buf, top, file) =>
    webp(sharp({ create: canvas }).composite([{ input: buf, top, left: 0 }]), join(OUT, file))

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

/** Average colour of the opaque pixels. */
async function skinTone(buf) {
  const { data } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const sum = [0, 0, 0]
  let n = 0
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 240) continue
    sum[0] += data[i]
    sum[1] += data[i + 1]
    sum[2] += data[i + 2]
    n++
  }
  return sum.map((s) => s / n)
}

/** The photos crop the forearm with a hard edge; fade the bottom third out instead. */
async function fadeWrist(buf) {
  const { width, height } = await sharp(buf).metadata()
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0.62" stop-color="#fff" stop-opacity="1"/>
        <stop offset="0.97" stop-color="#fff" stop-opacity="0"/>
      </linearGradient>
      <rect width="100%" height="100%" fill="url(#g)"/>
    </svg>`,
  )
  return sharp(buf).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer()
}

/**
 * Cursor hands. The two stock photos have different skin tones, so the
 * pointing hand is colour-matched to the gripping one; they read as the
 * same person's hand.
 */
async function hands() {
  const pointFile = find('hand point')
  const grabFile = find('hand grab')
  if (!pointFile || !grabFile) return 'skipped'
  await mkdir(join(OUT, 'cursor'), { recursive: true })
  const point = await fadeWrist(await sharp((await trimmed(pointFile)).data).resize(HAND_WIDTH).png().toBuffer())
  const grab = await fadeWrist(await sharp((await trimmed(grabFile)).data).resize(HAND_WIDTH).png().toBuffer())

  const [from, to] = await Promise.all([skinTone(point), skinTone(grab)])
  const alpha = await sharp(point).extractChannel(3).toBuffer()
  const rgb = await sharp(point).removeAlpha().png().toBuffer()
  const matched = await sharp(rgb)
    .linear(to.map((t, i) => t / from[i]), [0, 0, 0])
    .joinChannel(alpha)
    .png()
    .toBuffer()

  // Hotspot: the very tip of the index finger.
  const { data, info } = await sharp(matched).raw().toBuffer({ resolveWithObject: true })
  let tip = { x: 0, y: 0 }
  outer: for (let y = 0; y < info.height; y++) {
    const row = []
    for (let x = 0; x < info.width; x++) if (data[(y * info.width + x) * 4 + 3] > 160) row.push(x)
    if (row.length) {
      tip = { x: row[row.length >> 1], y }
      break outer
    }
  }

  const a = await webp(sharp(matched), join(OUT, 'cursor', 'point.webp'))
  const b = await webp(sharp(grab), join(OUT, 'cursor', 'grab.webp'))
  return {
    point: { width: a.width, height: a.height, hotspot: [+(tip.x / a.width).toFixed(3), +(tip.y / a.height).toFixed(3)] },
    grab: { width: b.width, height: b.height },
    tone: { from: from.map(Math.round), to: to.map(Math.round) },
  }
}

/** A soft Old Burgundy shadow cast by `buf`, padded so the blur isn't clipped. */
async function shadowOf(buf, { blur, opacity }) {
  const { width, height } = await sharp(buf).metadata()
  const alpha = await sharp(buf).ensureAlpha().extractChannel(3).linear(opacity, 0).toBuffer()
  const pad = Math.ceil(blur * 3)
  const input = await sharp({ create: { width, height, channels: 3, background: INK } })
    .joinChannel(alpha)
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { ...INK, alpha: 0 } })
    .blur(blur)
    .png()
    .toBuffer()
  return { input, pad }
}

/** The bag on a flat colour, with the same two-layer shadow the site uses. */
async function bagLayers(size, left, top) {
  const bag = await sharp(join(OUT, 'bag-closed.webp')).resize(size).png().toBuffer()
  const soft = await shadowOf(bag, { blur: size * 0.035, opacity: 0.26 })
  const contact = await shadowOf(bag, { blur: size * 0.008, opacity: 0.22 })
  return [
    { input: soft.input, left: Math.round(left - soft.pad), top: Math.round(top - soft.pad + size * 0.045) },
    { input: contact.input, left: Math.round(left - contact.pad), top: Math.round(top - contact.pad + size * 0.008) },
    { input: bag, left: Math.round(left), top: Math.round(top) },
  ]
}

const sample = async (file, x, y) => {
  // Seen over white, as the designs were (the thumbnail's background is translucent).
  const data = await sharp(file).flatten({ background: '#ffffff' }).extract({ left: x, top: y, width: 1, height: 1 }).raw().toBuffer()
  return { r: data[0], g: data[1], b: data[2] }
}

/**
 * Link-preview cover (1200×630) and icons. The designed cover's title is kept
 * as-is; its bag (which had a light fringe) is swapped for the clean cut-out,
 * and the rounded transparent corners are filled so previews don't show them.
 */
async function share() {
  const report = {}
  const coverFile = find('cover')
  if (coverFile) {
    const meta = await sharp(coverFile).metadata()
    const bg = await sample(coverFile, 60, Math.round(meta.height / 2))
    const W = 2000
    const H = 1050
    // Title only: everything left of the bag.
    const title = await sharp(coverFile)
      .resize(W, H)
      .extract({ left: 0, top: 0, width: 1180, height: H })
      .flatten({ background: bg })
      .png()
      .toBuffer()
    // Bag: same placement as the design — handles top at ~25%, bleeding off
    // the right and bottom edges.
    const size = 760
    const layers = await bagLayers(size, 1270, 255)
    // Composite on an oversized canvas (the bag bleeds off), then crop.
    const bleed = await sharp({ create: { width: W + 600, height: H + 600, channels: 3, background: bg } })
      .composite([{ input: title, left: 0, top: 0 }, ...layers])
      .png()
      .toBuffer()
    await sharp(bleed)
      .extract({ left: 0, top: 0, width: W, height: H })
      .resize(1200, 630)
      .jpeg({ quality: 86, mozjpeg: true })
      .toFile(join(PUBLIC, 'og-image.jpg'))
      .then((i) => (report.cover = { ...bg, kb: Math.round(i.size / 1024) }))
  }

  const thumbFile = find('thumbnail')
  if (thumbFile) {
    const bg = await sample(thumbFile, 400, 40)
    const S = 1024
    const size = Math.round(S * 0.56)
    const bagH = Math.round(size * 1.23)
    const icon = await sharp({ create: { width: S, height: S, channels: 3, background: bg } })
      .composite(await bagLayers(size, (S - size) / 2, (S - bagH) / 2 - S * 0.015))
      .png()
      .toBuffer()
    await sharp(icon).resize(512).png().toFile(join(PUBLIC, 'icon-512.png'))
    await sharp(icon).resize(180).png().toFile(join(PUBLIC, 'apple-touch-icon.png'))
    // Tiny sizes: crop in so the bag stays legible.
    const tight = await sharp(icon).extract({ left: 150, top: 110, width: 724, height: 724 }).png().toBuffer()
    await sharp(tight).resize(48).png().toFile(join(PUBLIC, 'favicon-48.png'))
    await sharp(tight).resize(32).png().toFile(join(PUBLIC, 'favicon-32.png'))
    report.icons = bg
  }
  return report
}

await mkdir(join(OUT, 'objects'), { recursive: true })
console.log(
  JSON.stringify(
    {
      bag: await bags(),
      objects: await cutouts(OBJECTS, 'objects', OBJECT_MAX),
      purse: await cutouts(PURSE, 'purse', PURSE_MAX),
      hands: await hands(),
      share: await share(),
    },
    null,
    2,
  ),
)
