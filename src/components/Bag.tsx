import { motion, useReducedMotion } from 'motion/react'
import type { Stage } from '../lib/stage'

type Props = {
  stage: Stage
  open: boolean
  canOpen: boolean
  dimmed: boolean
  closedSrc: string | null
  openSrc: string | null
  onOpen: () => void
}

export function Bag({ stage, open, canOpen, dimmed, closedSrc, openSrc, onOpen }: Props) {
  const reduce = useReducedMotion()
  const { cx, top, width, height } = stage.bag

  return (
    <motion.button
      type="button"
      className="bag"
      data-dimmed={dimmed || undefined}
      aria-label={canOpen ? 'Open the bag' : 'The bag'}
      aria-disabled={!canOpen}
      onClick={() => canOpen && onOpen()}
      // Once open, the bag's (mostly transparent) box must not block objects
      // sitting above it.
      style={{ left: cx - width / 2, top, width, height, pointerEvents: canOpen ? 'auto' : 'none' }}
      whileHover={canOpen && !reduce ? { scale: 1.035, rotate: -1.5 } : undefined}
      whileTap={canOpen ? { scale: 0.97 } : undefined}
      transition={{ type: 'spring', stiffness: 320, damping: 18 }}
    >
      <span className="bag-shadow" aria-hidden />
      <motion.div
        className="bag-body"
        animate={
          open
            ? { y: 0, scaleX: [1, 1.04, 0.99, 1], scaleY: [1, 0.93, 1.03, 1], transition: { duration: 0.55 } }
            : reduce
              ? { y: 0 }
              : { y: [0, -5, 0], transition: { repeat: Infinity, duration: 2.8, ease: 'easeInOut' } }
        }
        style={{ transformOrigin: '50% 100%' }}
      >
        {closedSrc ? (
          <>
            <img src={closedSrc} alt="" draggable={false} className="bag-img" style={{ opacity: open ? 0 : 1 }} />
            <img src={openSrc ?? closedSrc} alt="" draggable={false} className="bag-img" style={{ opacity: open ? 1 : 0 }} />
          </>
        ) : (
          <BagArt open={open} />
        )}
      </motion.div>
    </motion.button>
  )
}

/** Illustrated leather satchel with a flap that folds open. */
function BagArt({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 360 320" width="100%" height="100%" aria-hidden style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="bag-leather" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c47a45" />
          <stop offset=".55" stopColor="#9c5328" />
          <stop offset="1" stopColor="#6e3517" />
        </linearGradient>
        <linearGradient id="bag-flap" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b86a36" />
          <stop offset="1" stopColor="#8f4a22" />
        </linearGradient>
        <linearGradient id="bag-handle" x1="0" x2="1">
          <stop offset="0" stopColor="#7a3c1b" />
          <stop offset=".5" stopColor="#b8703c" />
          <stop offset="1" stopColor="#6a3216" />
        </linearGradient>
        <radialGradient id="bag-sheen" cx=".3" cy=".25" r=".7">
          <stop offset="0" stopColor="#fff" stopOpacity=".22" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="bag-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6e1a0" />
          <stop offset=".5" stopColor="#b48a35" />
          <stop offset="1" stopColor="#ecd08a" />
        </linearGradient>
        <filter id="bag-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="4" />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .55 0" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
        <clipPath id="bag-body-clip">
          <path d="M40 118 L320 118 Q336 118 338 134 L352 284 Q354 306 332 306 L28 306 Q6 306 8 284 L22 134 Q24 118 40 118 Z" />
        </clipPath>
      </defs>

      {/* handle */}
      <path d="M92 124 C92 30 268 30 268 124" fill="none" stroke="url(#bag-handle)" strokeWidth="16" strokeLinecap="round" />
      <path d="M92 124 C92 30 268 30 268 124" fill="none" stroke="#f4d2ad" strokeOpacity=".35" strokeWidth="1.2" strokeDasharray="5 5" />

      {/* dark interior, revealed when the flap lifts */}
      <path d="M34 112 Q180 96 326 112 L326 132 L34 132 Z" fill="#2a160b" />

      {/* body */}
      <g clipPath="url(#bag-body-clip)">
        <rect x="0" y="110" width="360" height="200" fill="url(#bag-leather)" />
        <rect x="0" y="110" width="360" height="200" fill="#000" filter="url(#bag-grain)" opacity=".35" />
        <rect x="0" y="110" width="360" height="200" fill="url(#bag-sheen)" />
      </g>
      <path
        d="M44 128 L316 128 Q326 128 327 138 L340 282 Q341 294 330 294 L30 294 Q19 294 20 282 L33 138 Q34 128 44 128 Z"
        fill="none"
        stroke="#f4d2ad"
        strokeOpacity=".35"
        strokeWidth="1.2"
        strokeDasharray="5 5"
      />
      {/* the opening */}
      <motion.path
        d="M36 118 Q180 100 324 118 Q180 140 36 118 Z"
        fill="#1f1008"
        initial={false}
        animate={{ opacity: open ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      />
      {/* handle rings */}
      <rect x="84" y="112" width="16" height="22" rx="5" fill="url(#bag-gold)" />
      <rect x="260" y="112" width="16" height="22" rx="5" fill="url(#bag-gold)" />

      {/* flap */}
      <motion.g
        initial={false}
        animate={{ scaleY: open ? -0.4 : 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        style={{ transformOrigin: '180px 116px', transformBox: 'view-box' }}
      >
        <path d="M30 114 L330 114 L322 196 Q180 236 38 196 Z" fill="url(#bag-flap)" />
        <path d="M30 114 L330 114 L322 196 Q180 236 38 196 Z" fill="#000" filter="url(#bag-grain)" opacity=".3" />
        <path d="M42 124 L318 124 L311 190 Q180 226 49 190 Z" fill="none" stroke="#f4d2ad" strokeOpacity=".4" strokeWidth="1.2" strokeDasharray="5 5" />
        <motion.path
          d="M30 114 L330 114 L322 196 Q180 236 38 196 Z"
          fill="#1a0c05"
          initial={false}
          animate={{ opacity: open ? 0.45 : 0 }}
        />
        <rect x="164" y="198" width="32" height="24" rx="6" fill="url(#bag-gold)" />
        <circle cx="180" cy="210" r="4" fill="#7a5a1c" />
      </motion.g>
    </svg>
  )
}
