/**
 * Everything the bag contains lives in this file.
 *
 * To swap in real photos, drop transparent PNG/WebP cut-outs into
 * `public/images/` and set `image` on the item (and `closed`/`open` on the
 * bag). Anything without an image, or whose image fails to load, falls back
 * to the built-in illustrated placeholder — the experience never breaks.
 *
 * Placement coordinates are offsets from the centre of the bag, expressed as
 * a fraction of the stage width (x) and height (y). `width` is in design
 * pixels and is scaled with the viewport. Desktop and mobile have their own
 * compositions (PRD §11).
 */

export type ArtKey =
  | 'idcard'
  | 'cdscard'
  | 'keys'
  | 'makeup'
  | 'laptop'
  | 'passport'
  | 'cash'
  | 'earbuds'
  | 'handcream'
  | 'powerbank'

export type Placement = {
  x: number
  y: number
  rotate: number
  width: number
}

export type BagItem = {
  id: string
  name: string
  description: string
  why: string
  image?: string
  art: ArtKey
  /** Semitone offset for this object's hover sound. */
  tone: number
  desktop: Placement
  mobile: Placement
}

export const BAG = {
  closed: '/images/bag-closed.webp' as string | undefined,
  /** Optional — the closed photo is reused if missing. */
  open: '/images/bag-open.webp' as string | undefined,
  /** height / width of the bag artwork (see `npm run images` output). */
  aspect: 1.23,
  /** Where the bag's opening sits, as a fraction of its height from the top. */
  mouth: 0.47,
  /**
   * Which point of the artwork (fraction of its height) sits at the centre
   * of the composition. The tote's body is the lower half of the photo — its
   * handles stand above it — so we centre on the body, not the whole image.
   */
  focus: 0.73,
}

export const ITEMS: BagItem[] = [
  {
    id: 'nysc-id',
    name: 'NYSC ID Card',
    description: 'My official NYSC ID.',
    why: 'Cos “Corper Wee” is not enough.',
    image: '/images/objects/nysc-id.webp',
    art: 'idcard',
    tone: 0,
    desktop: { x: -0.3, y: -0.26, rotate: -7, width: 165 },
    mobile: { x: -0.27, y: -0.33, rotate: -6, width: 100 },
  },
  {
    id: 'cds-card',
    name: 'NYSC CDS Card',
    description: 'Small NYSC card with my details on it.',
    why: 'CDS today, so yes, this had to come with me. No card, no clearance.',
    image: '/images/objects/cds-card.webp',
    art: 'cdscard',
    tone: 2,
    desktop: { x: -0.36, y: 0.04, rotate: 6, width: 175 },
    mobile: { x: -0.26, y: -0.15, rotate: 6, width: 104 },
  },
  {
    id: 'keys',
    name: 'House Keys',
    description: 'Three tiny keys.',
    why: 'Because how else am I getting back inside?',
    image: '/images/objects/keys.webp',
    art: 'keys',
    tone: 4,
    desktop: { x: 0.36, y: -0.03, rotate: -10, width: 140 },
    mobile: { x: 0.03, y: -0.19, rotate: -8, width: 80 },
  },
  {
    id: 'makeup',
    name: 'Tiny Makeup Purse',
    description: 'A tiny pouch carrying lip glosses and lip liner.',
    why: 'You can’t be a baddie without the essentials.',
    image: '/images/objects/makeup-purse.webp',
    art: 'makeup',
    tone: 5,
    desktop: { x: -0.11, y: 0.33, rotate: -4, width: 135 },
    mobile: { x: -0.08, y: 0.36, rotate: -4, width: 86 },
  },
  {
    id: 'laptop',
    name: 'Laptop',
    description: 'Big and heavy and always with me.',
    why: 'Work never stops. Unfortunately.',
    image: '/images/objects/laptop.webp',
    art: 'laptop',
    tone: -3,
    desktop: { x: 0.19, y: -0.29, rotate: -3, width: 255 },
    mobile: { x: 0.24, y: -0.33, rotate: -3, width: 142 },
  },
  {
    id: 'passport',
    name: 'Passport',
    description: 'My brand-new passport.',
    why: 'Need to catch flights cos I’ve already caught feelings.',
    image: '/images/objects/passport.webp',
    art: 'passport',
    tone: 7,
    desktop: { x: -0.09, y: -0.33, rotate: 6, width: 100 },
    mobile: { x: -0.01, y: -0.36, rotate: 5, width: 60 },
  },
  {
    id: 'cash',
    name: 'Cash',
    description: 'A few naira notes.',
    why: 'Korope and keke don’t run on good intentions.',
    image: '/images/objects/cash.webp',
    art: 'cash',
    tone: 9,
    desktop: { x: -0.3, y: 0.3, rotate: 4, width: 150 },
    mobile: { x: -0.25, y: 0.2, rotate: 4, width: 96 },
  },
  {
    id: 'earbuds',
    name: 'Oraimo Earbuds',
    description: 'My tiny little escape pods.',
    why: 'Lagos is too loud, please.',
    image: '/images/objects/earbuds.webp',
    art: 'earbuds',
    tone: 12,
    desktop: { x: 0.37, y: 0.24, rotate: -4, width: 125 },
    mobile: { x: 0.05, y: 0.21, rotate: -4, width: 76 },
  },
  {
    id: 'handcream',
    name: 'Hand Cream',
    description: 'A tiny tube of Dior hand cream.',
    why: 'Can’t be walking around looking ashy.',
    image: '/images/objects/hand-cream.webp',
    art: 'handcream',
    tone: 14,
    desktop: { x: 0.22, y: 0.05, rotate: -12, width: 64 },
    mobile: { x: 0.32, y: -0.15, rotate: -12, width: 38 },
  },
  {
    id: 'powerbank',
    name: 'Power Bank',
    description: 'Big and clunky.',
    why: 'Because NEPA and I don’t have an agreement.',
    image: '/images/objects/power-bank.webp',
    art: 'powerbank',
    tone: 1,
    desktop: { x: 0.15, y: 0.33, rotate: 4, width: 96 },
    mobile: { x: 0.3, y: 0.22, rotate: 4, width: 60 },
  },
]
