import { useEffect } from 'react'
import { motion, useReducedMotion, type Variants } from 'motion/react'
import type { BagItem } from '../data/bag'
import { placeItem, type Stage } from '../lib/stage'
import { sound } from '../lib/sound'
import { ObjectArt } from './ObjectArt'

/**
 * hidden – tucked inside the bag
 * out    – emerging along an arc from the bag to its resting place
 * rest   – settled (also used to re-place on resize without replaying)
 * in     – being packed back into the bag
 */
export type ObjectMode = 'hidden' | 'out' | 'rest' | 'in'

type Props = {
  item: BagItem
  index: number
  count: number
  stage: Stage
  mode: ObjectMode
  src: string | null
  interactive: boolean
  active: boolean
  dimmed: boolean
  onSettled: (id: string) => void
  onPacked: (id: string) => void
  onHoverStart: (id: string) => void
  onHoverEnd: (id: string) => void
  onSelect: (id: string) => void
  onFocusIn: (id: string) => void
  onFocusOut: (id: string) => void
  registerRef: (id: string, el: HTMLElement | null) => void
}

const OPEN_DELAY = 0.3
const STAGGER = 0.12

type Path = ReturnType<typeof paths>

function paths(item: BagItem, index: number, stage: Stage) {
  const end = placeItem(item, stage)
  const { cx, mouthY } = stage.bag
  const u = stage.unit
  // Start hidden behind the front of the bag, rise out of the opening,
  // then arc outward to the resting spot.
  const start = { x: cx + ((index % 5) - 2) * 14 * u, y: mouthY + 40 * u }
  const peak = {
    x: cx + (end.x - cx) * 0.2,
    y: mouthY - (110 + (index % 3) * 22) * u,
  }
  const wobble = (index % 2 ? 1 : -1) * (10 + (index % 3) * 5)
  return { start, peak, end, wobble }
}

const variants: Variants = {
  hidden: ({ start }: Path) => ({
    x: start.x,
    y: start.y,
    rotate: 0,
    scale: 0.45,
    opacity: 0,
    transition: { duration: 0 },
  }),
  out: ({ start, peak, end, wobble, delay, reduce }: Path & { delay: number; reduce: boolean }) =>
    reduce
      ? {
          x: end.x,
          y: end.y,
          rotate: end.rotate,
          scale: 1,
          opacity: 1,
          transition: { duration: 0.35, delay: delay * 0.3 },
        }
      : {
          x: [start.x, peak.x, end.x],
          y: [start.y, peak.y, end.y],
          rotate: [0, wobble, end.rotate],
          scale: [0.45, 0.82, 1],
          opacity: [0, 1, 1],
          transition: {
            delay,
            duration: 1,
            times: [0, 0.36, 1],
            // Pop up quickly, then glide out and land with a small overshoot.
            ease: ['easeOut', [0.3, 1.28, 0.5, 1]],
            opacity: { delay, duration: 0.18 },
          },
        },
  rest: ({ end }: Path) => ({
    x: end.x,
    y: end.y,
    rotate: end.rotate,
    scale: 1,
    opacity: 1,
    transition: { type: 'spring', stiffness: 200, damping: 26 },
  }),
  in: ({ start, peak, end, wobble, delay, reduce }: Path & { delay: number; reduce: boolean }) =>
    reduce
      ? { x: start.x, y: start.y, scale: 0.45, opacity: 0, transition: { duration: 0.3 } }
      : {
          x: [end.x, peak.x, start.x],
          y: [end.y, peak.y, start.y],
          rotate: [end.rotate, wobble, 0],
          scale: [1, 0.82, 0.45],
          opacity: [1, 1, 0],
          transition: {
            delay,
            duration: 0.8,
            times: [0, 0.6, 1],
            ease: [[0.5, 0, 0.7, 0.4], 'easeIn'],
            opacity: { delay: delay + 0.68, duration: 0.12 },
          },
        },
}

export function BagObject(props: Props) {
  const { item, index, count, stage, mode, src, interactive, active, dimmed } = props
  const reduce = !!useReducedMotion()
  const path = paths(item, index, stage)
  const delay = mode === 'in' ? (count - 1 - index) * 0.07 : OPEN_DELAY + index * STAGGER

  // A little pop as each object clears the bag.
  useEffect(() => {
    if (mode !== 'out') return
    const t = setTimeout(() => sound.pop(index), (delay + 0.08) * 1000)
    return () => clearTimeout(t)
  }, [mode, delay, index])

  return (
    <motion.div
      className="object"
      data-dimmed={dimmed || undefined}
      style={{ zIndex: active ? 30 : 5 + index }}
      custom={{ ...path, delay, reduce }}
      variants={variants}
      initial="hidden"
      animate={mode}
      onAnimationComplete={(def) => {
        if (def === 'out') props.onSettled(item.id)
        if (def === 'in') props.onPacked(item.id)
      }}
    >
      <motion.div
        className="object-lift"
        animate={
          active && !reduce
            ? { scale: 1.08, y: -8 * stage.unit, rotate: -path.end.rotate * 0.35 }
            : { scale: 1, y: 0, rotate: 0 }
        }
        transition={{ type: 'spring', stiffness: 380, damping: 20 }}
      >
        <button
          ref={(el) => props.registerRef(item.id, el)}
          type="button"
          className="object-button"
          data-object={item.id}
          data-active={active || undefined}
          tabIndex={interactive ? 0 : -1}
          aria-hidden={mode === 'hidden' || undefined}
          aria-label={item.name}
          aria-expanded={active}
          style={{ width: path.end.width, pointerEvents: interactive ? 'auto' : 'none' }}
          onPointerEnter={(e) => e.pointerType === 'mouse' && interactive && props.onHoverStart(item.id)}
          onPointerLeave={(e) => e.pointerType === 'mouse' && props.onHoverEnd(item.id)}
          onClick={(e) => {
            e.stopPropagation()
            if (interactive) props.onSelect(item.id)
          }}
          onFocus={(e) => interactive && e.currentTarget.matches(':focus-visible') && props.onFocusIn(item.id)}
          onBlur={() => props.onFocusOut(item.id)}
        >
          {src ? <img src={src} alt="" draggable={false} /> : <ObjectArt art={item.art} />}
        </button>
      </motion.div>
    </motion.div>
  )
}
