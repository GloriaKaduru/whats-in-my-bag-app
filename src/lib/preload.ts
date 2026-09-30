import { BAG, ITEMS } from '../data/bag'

export type Assets = {
  bagClosed: string | null
  bagOpen: string | null
  items: Record<string, string | null>
}

function loadImage(src?: string): Promise<string | null> {
  if (!src) return Promise.resolve(null)
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(src)
    img.onerror = () => {
      console.warn(`[bag] Could not load "${src}" — using the illustrated placeholder instead.`)
      resolve(null)
    }
    img.src = src
  })
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Loads every image (and the fonts) up front so the composition never
 * appears half-assembled (PRD §13 “Slow asset loading”).
 */
export async function preloadAssets(): Promise<Assets> {
  const fonts = Promise.race([document.fonts?.ready ?? Promise.resolve(), wait(2500)])
  const [[bagClosed, bagOpen, ...items]] = await Promise.all([
    Promise.all([loadImage(BAG.closed), loadImage(BAG.open), ...ITEMS.map((item) => loadImage(item.image))]),
    fonts,
    wait(700),
  ])
  return {
    bagClosed,
    bagOpen: bagOpen ?? bagClosed,
    items: Object.fromEntries(ITEMS.map((item, i) => [item.id, items[i]])),
  }
}
