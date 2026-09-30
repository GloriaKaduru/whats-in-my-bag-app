import { useMemo } from 'react'
import { motion, useReducedMotion } from 'motion/react'

type Props = {
  count: number
  onRepack: () => void
  onReplay: () => void
}

/** Small, celebratory-but-quiet note pinned to the bottom of the scene. */
export function Completion({ count, onRepack, onReplay }: Props) {
  const reduce = useReducedMotion()
  return (
    <>
      {!reduce && <Confetti />}
      <motion.div
        className="complete"
        role="status"
        initial={{ opacity: 0, y: 24, rotate: -3 }}
        animate={{ opacity: 1, y: 0, rotate: -1 }}
        exit={{ opacity: 0, y: 16, transition: { duration: 0.18 } }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        <p className="complete-title">You found everything ✨</p>
        <p className="complete-sub">All {count} little things, accounted for.</p>
        <div className="complete-actions">
          <button type="button" className="btn btn-primary" onClick={onRepack}>
            Put everything back
          </button>
          <button type="button" className="btn btn-ghost" onClick={onReplay}>
            Explore again
          </button>
        </div>
      </motion.div>
    </>
  )
}

const COLORS = ['#fff1b5', '#c1dbe8', '#43302e', '#f5e08a', '#a9cde0']

function Confetti() {
  const bits = useMemo(
    () =>
      Array.from({ length: 34 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 1.8 + Math.random() * 1.2,
        drift: (Math.random() - 0.5) * 120,
        spin: (Math.random() - 0.5) * 720,
        w: 6 + Math.random() * 6,
        h: 8 + Math.random() * 10,
        color: COLORS[i % COLORS.length],
      })),
    [],
  )
  return (
    <div className="confetti" aria-hidden>
      {bits.map((b) => (
        <motion.span
          key={b.id}
          style={{ left: `${b.left}%`, width: b.w, height: b.h, background: b.color }}
          initial={{ y: -40, x: 0, rotate: 0, opacity: 1 }}
          animate={{ y: '105vh', x: b.drift, rotate: b.spin, opacity: [1, 1, 0] }}
          transition={{ duration: b.duration, delay: b.delay, ease: [0.2, 0.6, 0.4, 1] }}
        />
      ))}
    </div>
  )
}
