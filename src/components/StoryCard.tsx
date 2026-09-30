import { useLayoutEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import type { BagItem } from '../data/bag'

type Props = {
  item: BagItem
  anchor: DOMRect
  mobile: boolean
}

type Side = 'right' | 'left' | 'below' | 'above'

const GAP = 16
const MARGIN = 12

/** A torn scrap of paper, generated once so every card shares the same edge. */
const TORN = (() => {
  const pts: string[] = []
  const steps = 26
  let seed = 7
  const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280)
  for (let i = 0; i <= steps; i++) pts.push(`${(i / steps) * 100}% ${rand() * 5}px`)
  for (let i = steps; i >= 0; i--) pts.push(`${(i / steps) * 100}% calc(100% - ${rand() * 5}px)`)
  return `polygon(${pts.join(',')})`
})()

function place(anchor: DOMRect, w: number, h: number, mobile: boolean) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const midX = anchor.left + anchor.width / 2
  const midY = anchor.top + anchor.height / 2
  const spots: Record<Side, { left: number; top: number }> = {
    right: { left: anchor.right + GAP, top: midY - h / 2 },
    left: { left: anchor.left - GAP - w, top: midY - h / 2 },
    below: { left: midX - w / 2, top: anchor.bottom + GAP },
    above: { left: midX - w / 2, top: anchor.top - GAP - h },
  }
  const horizontal: Side[] = midX > vw / 2 ? ['left', 'right'] : ['right', 'left']
  const vertical: Side[] = midY > vh / 2 ? ['above', 'below'] : ['below', 'above']
  const order = mobile ? [...vertical, ...horizontal] : [...horizontal, ...vertical]
  const fits = ({ left, top }: { left: number; top: number }) =>
    left >= MARGIN && top >= MARGIN && left + w <= vw - MARGIN && top + h <= vh - MARGIN
  const side = order.find((s) => fits(spots[s])) ?? order[0]
  const spot = spots[side]
  // Whatever happens, stay inside the viewport (PRD §13).
  return {
    side,
    left: Math.min(Math.max(spot.left, MARGIN), vw - w - MARGIN),
    top: Math.min(Math.max(spot.top, MARGIN), vh - h - MARGIN),
  }
}

export function StoryCard({ item, anchor, mobile }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const [pos, setPos] = useState<ReturnType<typeof place> | null>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setPos(place(anchor, el.offsetWidth, el.offsetHeight, mobile))
  }, [anchor, mobile])

  const tilt = pos?.side === 'left' ? -1.8 : pos?.side === 'right' ? 1.6 : -0.8
  const from = { right: { x: -10 }, left: { x: 10 }, below: { y: -10 }, above: { y: 10 } }[pos?.side ?? 'right']

  return (
    <motion.div
      ref={ref}
      className="card"
      role="note"
      aria-live="polite"
      style={{ left: pos?.left ?? 0, top: pos?.top ?? 0, visibility: pos ? 'visible' : 'hidden' }}
      initial={{ opacity: 0, scale: 0.94, rotate: 0, ...(reduce ? {} : from) }}
      animate={{ opacity: 1, scale: 1, rotate: tilt, x: 0, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.12 } }}
      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
    >
      <span className="card-tape" aria-hidden />
      <div className="card-paper" style={{ clipPath: TORN }}>
        <p className="card-name">{item.name}</p>
        <p className="card-desc">{item.description}</p>
        <p className="card-label">Why it’s in my bag</p>
        <p className="card-why">{item.why}</p>
      </div>
    </motion.div>
  )
}
