import { useEffect, useRef } from 'react'
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  useVelocity,
  type Variants,
} from 'motion/react'
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

export type Point = { x: number; y: number }

type Props = {
  item: BagItem
  index: number
  count: number
  stage: Stage
  mode: ObjectMode
  src: string | null
  contents: Record<string, string | null>
  interactive: boolean
  active: boolean
  dimmed: boolean
  /** Not looked at yet: shows the pulsing dot. */
  unseen: boolean
  dragging: boolean
  zIndex: number
  onSettled: (id: string) => void
  onPacked: (id: string) => void
  onHoverStart: (id: string) => void
  onHoverEnd: (id: string) => void
  onSelect: (id: string) => void
  onFocusIn: (id: string) => void
  onFocusOut: (id: string) => void
  onDragStart: (id: string) => void
  onDrag: (id: string, point: Point) => void
  /** `tap` is a touch that only wobbled: treat it as a tap, not a put-down. */
  onDragEnd: (id: string, point: Point, tap: boolean) => void
  registerRef: (id: string, el: HTMLElement | null) => void
}

const OPEN_DELAY = 0.38
const STAGGER = 0.12
/** Keep dragged objects reachable: their centre stays this far inside the screen. */
const EDGE = 36
/** A finger can drift this far (px) and still count as a tap. */
const TAP_SLOP = 12

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
  const { item, index, count, stage, mode, src, interactive, active, dimmed, unseen, dragging } = props
  const reduce = !!useReducedMotion()
  const path = paths(item, index, stage)
  const delay = mode === 'in' ? (count - 1 - index) * 0.07 : OPEN_DELAY + index * STAGGER
  const u = stage.unit

  // Where the visitor has dragged it, relative to its resting spot. Stored as
  // a fraction of the screen too, so a resize keeps it in proportion.
  const dx = useMotionValue(0)
  const dy = useMotionValue(0)
  const offset = useRef({ x: 0, y: 0 })
  const moved = useRef(false)
  const touch = useRef(false)

  // Lean into the direction of travel while dragging.
  const vx = useVelocity(dx)
  const lean = useSpring(useTransform(vx, [-1600, 1600], [-9, 9], { clamp: true }), { stiffness: 320, damping: 26 })

  useEffect(() => {
    dx.set(offset.current.x * stage.width)
    dy.set(offset.current.y * stage.height)
  }, [stage, dx, dy])

  useEffect(() => {
    if (mode === 'hidden') {
      offset.current = { x: 0, y: 0 }
      dx.set(0)
      dy.set(0)
    }
    // Packing: fold the drag offset away alongside the arc into the bag.
    if (mode === 'in') {
      offset.current = { x: 0, y: 0 }
      const t = { duration: reduce ? 0.3 : 0.62, delay, ease: [0.4, 0, 0.6, 1] as const }
      const a = animate(dx, 0, t)
      const b = animate(dy, 0, t)
      return () => {
        a.stop()
        b.stop()
      }
    }
  }, [mode, delay, reduce, dx, dy])

  // A little pop as each object clears the bag.
  useEffect(() => {
    if (mode !== 'out') return
    const t = setTimeout(() => sound.pop(index), (delay + 0.08) * 1000)
    return () => clearTimeout(t)
  }, [mode, delay, index])

  const { end } = path
  const constraints = {
    left: EDGE - end.x,
    right: stage.width - EDGE - end.x,
    top: (stage.mobile ? 96 : 110) * u - end.y,
    bottom: stage.height - EDGE - end.y,
  }

  const hotspot = item.hotspot ?? { x: 0.5, y: 0.5 }
  const lifted = active || dragging

  return (
    <motion.div
      className="object"
      data-dimmed={dimmed || undefined}
      style={{ zIndex: props.zIndex }}
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
        className="object-drag"
        style={{ x: dx, y: dy, rotate: lean }}
        drag={interactive}
        dragConstraints={constraints}
        dragElastic={0.14}
        dragTransition={{ power: 0.18, timeConstant: 180, bounceStiffness: 420, bounceDamping: 32 }}
        onPointerDownCapture={(e) => {
          moved.current = false
          touch.current = e.pointerType !== 'mouse'
        }}
        onDragStart={() => {
          moved.current = true
          sound.tick(item.tone + 5)
          props.onDragStart(item.id)
        }}
        onDrag={(_, info) => props.onDrag(item.id, info.point)}
        onDragEnd={(_, info) => {
          const tap = touch.current && Math.hypot(info.offset.x, info.offset.y) < TAP_SLOP
          if (!tap) sound.pop(index)
          props.onDragEnd(item.id, info.point, tap)
        }}
        onDragTransitionEnd={() => {
          offset.current = { x: dx.get() / stage.width, y: dy.get() / stage.height }
        }}
      >
        <motion.div
          className="object-lift"
          animate={
            lifted && !reduce
              ? {
                  scale: dragging ? 1.06 : 1.08,
                  y: -8 * u,
                  rotate: dragging ? 0 : -end.rotate * 0.35,
                }
              : { scale: 1, y: 0, rotate: 0 }
          }
          transition={{ type: 'spring', stiffness: 380, damping: 20 }}
        >
          {item.contents && (
            <div className="object-contents" aria-hidden>
              {item.contents.map((c, i) => {
                const csrc = props.contents[c.id]
                if (!csrc) return null
                const shown = active && !dragging
                return (
                  <span key={c.id} className="object-content" style={{ left: c.x * u, top: c.y * u }}>
                    <motion.img
                      src={csrc}
                      alt=""
                      draggable={false}
                      style={{ height: c.height * u }}
                      initial={false}
                      animate={
                        shown
                          ? { opacity: 1, y: 0, scale: 1, rotate: c.rotate }
                          : { opacity: 0, y: 36 * u, scale: 0.6, rotate: 0 }
                      }
                      transition={
                        shown
                          ? { type: 'spring', stiffness: 360, damping: 20, delay: reduce ? 0 : 0.04 + i * 0.05 }
                          : { duration: 0.14 }
                      }
                    />
                  </span>
                )
              })}
            </div>
          )}
          <button
            ref={(el) => props.registerRef(item.id, el)}
            type="button"
            className="object-button"
            data-object={item.id}
            data-hand="grab"
            data-active={active || undefined}
            data-dragging={dragging || undefined}
            tabIndex={interactive ? 0 : -1}
            aria-hidden={mode === 'hidden' || undefined}
            aria-label={item.name}
            aria-expanded={active}
            style={{ width: end.width, pointerEvents: interactive ? 'auto' : 'none' }}
            onPointerEnter={(e) => e.pointerType === 'mouse' && interactive && props.onHoverStart(item.id)}
            onPointerLeave={(e) => e.pointerType === 'mouse' && props.onHoverEnd(item.id)}
            onClick={(e) => {
              e.stopPropagation()
              // The click that ends a drag isn't a tap.
              if (moved.current) return
              if (interactive) props.onSelect(item.id)
            }}
            onFocus={(e) => interactive && e.currentTarget.matches(':focus-visible') && props.onFocusIn(item.id)}
            onBlur={() => props.onFocusOut(item.id)}
          >
            {src ? <img src={src} alt="" draggable={false} /> : <ObjectArt art={item.art} />}
            <AnimatePresence>
              {unseen && interactive && (
                <motion.span
                  key="dot"
                  className="object-dot"
                  style={{ left: `${hotspot.x * 100}%`, top: `${hotspot.y * 100}%` }}
                  initial={{ opacity: 0, scale: 0.4 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.4, transition: { duration: 0.25 } }}
                  aria-hidden
                />
              )}
            </AnimatePresence>
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
