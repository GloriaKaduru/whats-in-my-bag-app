import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ITEMS } from './data/bag'
import { useStage } from './lib/stage'
import { preloadAssets, type Assets } from './lib/preload'
import { sound } from './lib/sound'
import { Bag } from './components/Bag'
import { BagObject, type ObjectMode } from './components/BagObject'
import { StoryCard } from './components/StoryCard'
import { Completion } from './components/Completion'

type Phase = 'loading' | 'closed' | 'opening' | 'open' | 'packing'

/** How long the cursor must rest on an object before it counts as found. */
const HOVER_DWELL = 350

export default function App() {
  const stage = useStage()
  const [phase, setPhase] = useState<Phase>('loading')
  const [assets, setAssets] = useState<Assets | null>(null)
  const [settled, setSettled] = useState<Set<string>>(() => new Set())
  const [found, setFound] = useState<Set<string>>(() => new Set())
  const [active, setActive] = useState<string | null>(null)
  const [anchor, setAnchor] = useState<DOMRect | null>(null)
  const [celebrating, setCelebrating] = useState(false)
  const [muted, setMuted] = useState(sound.isMuted)

  const buttons = useRef(new Map<string, HTMLElement>())
  const dwell = useRef<number | undefined>(undefined)
  const replay = useRef(false)

  const complete = found.size === ITEMS.length

  useEffect(() => {
    preloadAssets().then((a) => {
      setAssets(a)
      setPhase('closed')
    })
  }, [])

  // ——— Opening ———
  const phaseRef = useRef(phase)
  phaseRef.current = phase

  const openBag = useCallback(() => {
    // Extra clicks while opening are ignored (PRD §13).
    if (phaseRef.current !== 'closed') return
    phaseRef.current = 'opening'
    sound.unlock()
    sound.zip()
    setSettled(new Set())
    setPhase('opening')
  }, [])

  const onSettled = useCallback((id: string) => setSettled((s) => new Set(s).add(id)), [])

  useEffect(() => {
    if (phase === 'opening' && settled.size === ITEMS.length) setPhase('open')
  }, [phase, settled])

  // ——— Packing ———
  const onPacked = useCallback((id: string) => {
    setSettled((s) => {
      const next = new Set(s)
      next.delete(id)
      return next
    })
  }, [])

  useEffect(() => {
    if (phase !== 'packing' || settled.size > 0) return
    setPhase('closed')
    setFound(new Set())
  }, [phase, settled])

  // “Explore again”: once everything is back in, open the bag again.
  useEffect(() => {
    if (phase !== 'closed' || !replay.current) return
    replay.current = false
    const t = setTimeout(openBag, 550)
    return () => clearTimeout(t)
  }, [phase, openBag])

  const pack = (thenReplay: boolean) => {
    if (phase !== 'open') return
    replay.current = thenReplay
    clearTimeout(dwell.current)
    setActive(null)
    setCelebrating(false)
    sound.whoosh()
    setPhase('packing')
  }

  // ——— Inspecting ———
  const markFound = useCallback((id: string) => {
    setFound((f) => (f.has(id) ? f : new Set(f).add(id)))
  }, [])

  const inspect = useCallback(
    (id: string) => {
      const item = ITEMS.find((i) => i.id === id)
      if (item) sound.tick(item.tone)
      setActive(id)
    },
    [],
  )

  const onHoverStart = (id: string) => {
    inspect(id)
    clearTimeout(dwell.current)
    dwell.current = window.setTimeout(() => markFound(id), HOVER_DWELL)
  }

  const onHoverEnd = (id: string) => {
    clearTimeout(dwell.current)
    setActive((a) => (a === id ? null : a))
  }

  // Tap / click: toggles on touch, always opens on mouse.
  const onSelect = (id: string) => {
    markFound(id)
    if (active !== id) return inspect(id)
    if (!window.matchMedia('(hover: hover)').matches) setActive(null)
  }

  const onFocusIn = (id: string) => {
    inspect(id)
    markFound(id)
  }

  const onFocusOut = (id: string) => setActive((a) => (a === id ? null : a))

  // Keep the card attached to the object (also across resizes).
  useEffect(() => {
    if (!active) return setAnchor(null)
    const measure = () => {
      const el = buttons.current.get(active)
      if (el) setAnchor(el.getBoundingClientRect())
    }
    // Wait for the lift animation to start so the rect is representative.
    const frame = requestAnimationFrame(measure)
    return () => cancelAnimationFrame(frame)
  }, [active, stage])

  // Escape closes the card; clicking empty space closes it on touch.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setActive(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ——— Completion ———
  // Let the final object's card be read first; celebrate once it closes
  // (or after a short beat if the visitor leaves it open).
  useEffect(() => {
    if (!complete || phase !== 'open' || celebrating) return
    const t = setTimeout(
      () => {
        setCelebrating(true)
        sound.chime()
      },
      active ? 2200 : 450,
    )
    return () => clearTimeout(t)
  }, [complete, phase, active, celebrating])

  const toggleMute = () => {
    const next = !muted
    sound.setMuted(next)
    setMuted(next)
    if (!next) sound.tick(7)
  }

  const modeFor = (id: string): ObjectMode => {
    if (phase === 'packing') return 'in'
    if (phase === 'opening') return settled.has(id) ? 'rest' : 'out'
    if (phase === 'open') return 'rest'
    return 'hidden'
  }

  const activeItem = ITEMS.find((i) => i.id === active)
  const isOut = phase === 'opening' || phase === 'open' || phase === 'packing'
  const hint = stage.mobile ? 'tap' : 'click'
  const peekHint = stage.mobile ? 'tap anything to peek' : 'hover over anything to peek'

  return (
    <main className="scene" onClick={() => setActive(null)}>
      <AnimatePresence>
        {phase === 'loading' && (
          <motion.div className="loader" key="loader" exit={{ opacity: 0, transition: { duration: 0.4 } }}>
            <p>packing the bag</p>
            <span className="loader-dots" aria-hidden>
              <i />
              <i />
              <i />
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {assets && (
        <>
          <header className="hud">
            <motion.h1
              className="hud-title"
              initial={{ opacity: 0 }}
              animate={{ opacity: isOut ? 1 : 0 }}
              transition={{ duration: 0.4 }}
            >
              What’s in my bag?
            </motion.h1>
            <div className="hud-right">
              <AnimatePresence>
                {isOut && (
                  <motion.div
                    className="counter"
                    aria-live="polite"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <span className="counter-dots" aria-hidden>
                      {ITEMS.map((i) => (
                        <i key={i.id} data-on={found.has(i.id) || undefined} />
                      ))}
                    </span>
                    <span>
                      {found.size} of {ITEMS.length} found
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
              <button
                type="button"
                className="mute"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleMute()
                }}
                aria-pressed={!muted}
                aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
              >
                <SoundIcon muted={muted} />
              </button>
            </div>
          </header>

          <AnimatePresence>
            {phase === 'closed' && (
              <motion.div
                key="intro"
                className="intro"
                style={{ bottom: stage.height - stage.bag.top + 20 * stage.unit }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.15, duration: 0.6 } }}
                exit={{ opacity: 0, y: -10, transition: { duration: 0.25 } }}
              >
                <h2 className="intro-title">What’s in my bag?</h2>
                <p className="intro-hint">
                  go on, {hint} it <Arrow />
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {ITEMS.map((item, index) => (
            <BagObject
              key={item.id}
              item={item}
              index={index}
              count={ITEMS.length}
              stage={stage}
              mode={modeFor(item.id)}
              src={assets.items[item.id]}
              interactive={phase === 'open' || (phase === 'opening' && settled.has(item.id))}
              active={active === item.id}
              dimmed={!!active && active !== item.id}
              onSettled={onSettled}
              onPacked={onPacked}
              onHoverStart={onHoverStart}
              onHoverEnd={onHoverEnd}
              onSelect={onSelect}
              onFocusIn={onFocusIn}
              onFocusOut={onFocusOut}
              registerRef={(id, el) => (el ? buttons.current.set(id, el) : buttons.current.delete(id))}
            />
          ))}

          <Bag
            stage={stage}
            open={isOut}
            canOpen={phase === 'closed'}
            dimmed={!!active}
            closedSrc={assets.bagClosed}
            openSrc={assets.bagOpen}
            onOpen={openBag}
          />

          <AnimatePresence>
            {activeItem && anchor && (
              <StoryCard key={activeItem.id} item={activeItem} anchor={anchor} mobile={stage.mobile} />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {phase === 'open' && found.size === 0 && !active && (
              <motion.p
                key="peek"
                className="peek-hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.4 } }}
                exit={{ opacity: 0 }}
              >
                {peekHint}
              </motion.p>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {celebrating && phase === 'open' && (
              <Completion key="done" count={ITEMS.length} onRepack={() => pack(false)} onReplay={() => pack(true)} />
            )}
          </AnimatePresence>
        </>
      )}
    </main>
  )
}

function Arrow() {
  return (
    <svg className="intro-arrow" viewBox="0 0 40 40" aria-hidden>
      <path d="M8 6 C 22 10, 28 18, 24 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M17 27 L24 33 L29 25" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SoundIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
      {muted ? (
        <path d="M16 9.5l5 5m0-5l-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      ) : (
        <>
          <path d="M15.5 9a4 4 0 010 6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M18 6.5a7.5 7.5 0 010 11" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </>
      )}
    </svg>
  )
}
