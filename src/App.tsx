import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ITEMS, PROFILE } from './data/bag'
import { useStage } from './lib/stage'
import { preloadAssets, type Assets } from './lib/preload'
import { sound } from './lib/sound'
import { Bag, bagBody } from './components/Bag'
import { BagObject, type ObjectMode, type Point } from './components/BagObject'
import { StoryCard } from './components/StoryCard'
import { Completion } from './components/Completion'

type Phase = 'loading' | 'closed' | 'opening' | 'open' | 'packing'

/** The title block glides from the centre into the header when the bag opens. */
const SHARED = { layout: { type: 'spring', stiffness: 170, damping: 26 } } as const

export default function App() {
  const stage = useStage()
  const [phase, setPhase] = useState<Phase>('loading')
  const [assets, setAssets] = useState<Assets | null>(null)
  const [settled, setSettled] = useState<Set<string>>(() => new Set())
  const [found, setFound] = useState<Set<string>>(() => new Set())
  /** Objects dropped back into the bag one at a time. */
  const [packed, setPacked] = useState<Set<string>>(() => new Set())
  const [active, setActive] = useState<string | null>(null)
  const [anchor, setAnchor] = useState<DOMRect | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const [overBag, setOverBag] = useState(false)
  /** Most recently touched last — decides which object sits on top. */
  const [stack, setStack] = useState<string[]>(() => ITEMS.map((i) => i.id))
  const [celebrating, setCelebrating] = useState(false)
  const [muted, setMuted] = useState(sound.isMuted)
  const [introHeight, setIntroHeight] = useState(0)

  const buttons = useRef(new Map<string, HTMLElement>())
  const intro = useRef<HTMLDivElement>(null)
  const replay = useRef(false)

  const complete = found.size === ITEMS.length

  useEffect(() => {
    preloadAssets().then((a) => {
      setAssets(a)
      setPhase('closed')
    })
  }, [])

  // ——— Closed layout: title, summary and bag centred as one group ———
  useLayoutEffect(() => {
    const el = intro.current
    if (!el) return
    const measure = () => setIntroHeight(el.offsetHeight)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [phase === 'closed'])

  const gap = 50 * stage.unit
  const groupHeight = introHeight + gap + stage.bag.height
  const groupTop = Math.max(24, (stage.height - groupHeight) / 2)
  const closedBagTop = groupTop + introHeight + gap
  const bagShift = phase === 'closed' || phase === 'loading' ? closedBagTop - stage.bag.top : 0

  // ——— Opening ———
  const phaseRef = useRef(phase)
  phaseRef.current = phase

  const openBag = useCallback(() => {
    // Extra clicks while opening are ignored (PRD §13).
    if (phaseRef.current !== 'closed') return
    phaseRef.current = 'opening'
    sound.unlock()
    sound.preload(ITEMS.flatMap((i) => (i.sound ? [i.sound] : [])))
    sound.zip()
    setSettled(new Set())
    setPacked(new Set())
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

  // Everything back inside (all at once, or one drop at a time): close up.
  useEffect(() => {
    if ((phase !== 'packing' && phase !== 'open') || settled.size > 0) return
    setPhase('closed')
    setFound(new Set())
    setPacked(new Set())
    setCelebrating(false)
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
    setActive(null)
    setCelebrating(false)
    sound.whoosh()
    setPhase('packing')
  }

  const packOne = (id: string) => {
    setActive(null)
    sound.whoosh()
    setPacked((p) => new Set(p).add(id))
  }

  // ——— Inspecting ———
  const markFound = useCallback((id: string) => {
    setFound((f) => (f.has(id) ? f : new Set(f).add(id)))
  }, [])

  // Hover (or a tap, touch's hover) plays the object's recorded effect;
  // keyboard focus just ticks.
  const inspect = useCallback((id: string, withEffect: boolean) => {
    const item = ITEMS.find((i) => i.id === id)
    if (item?.sound && withEffect) sound.effect(item.sound, item.soundOptions)
    else if (item) sound.tick(item.tone)
    setActive(id)
  }, [])

  const onHoverStart = (id: string) => {
    if (!dragging) inspect(id, true)
  }

  const onHoverEnd = (id: string) => {
    sound.stopEffect()
    setActive((a) => (a === id ? null : a))
  }

  // Tap / click: toggles on touch, always opens on mouse.
  const onSelect = (id: string) => {
    if (active !== id) return inspect(id, true)
    if (!window.matchMedia('(hover: hover)').matches) {
      sound.stopEffect()
      setActive(null)
    }
  }

  const onFocusIn = (id: string) => inspect(id, false)

  const onFocusOut = (id: string) => setActive((a) => (a === id ? null : a))

  // ——— Dragging ———
  const toTop = (id: string) => setStack((s) => [...s.filter((x) => x !== id), id])

  const inBag = (p: Point) => {
    const b = bagBody(stage)
    return p.x > b.left && p.x < b.right && p.y > b.top && p.y < b.bottom
  }

  const onDragStart = (id: string) => {
    setDragging(id)
    setActive(null)
    toTop(id)
  }

  const onDrag = (_: string, p: Point) => {
    const over = inBag(p)
    if (over !== overBag) setOverBag(over)
  }

  const onDragEnd = (id: string, p: Point, tap: boolean) => {
    setDragging(null)
    setOverBag(false)
    // A wobbly finger tap: play the object's sound like any other tap.
    if (tap) return inspect(id, true)
    if (inBag(p)) return packOne(id)
    // Put down: show its note again (which also counts it as found).
    inspect(id, false)
  }

  // Keep the card attached to the object (also across resizes).
  useEffect(() => {
    if (!active) return setAnchor(null)
    const measure = () => {
      const el = buttons.current.get(active)
      if (!el) return
      let r = el.getBoundingClientRect()
      // The purse's contents fan out above it; keep the card clear of them.
      const contents = ITEMS.find((i) => i.id === active)?.contents
      if (contents) {
        const reach = (Math.max(...contents.map((c) => -c.y + c.height / 2)) + 14) * stage.unit
        const top = Math.min(r.top, r.top + r.height / 2 - reach)
        r = new DOMRect(r.left, top, r.width, r.bottom - top)
      }
      setAnchor(r)
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
    if (phase === 'packing' || packed.has(id)) return 'in'
    if (phase === 'opening') return settled.has(id) ? 'rest' : 'out'
    if (phase === 'open') return 'rest'
    return 'hidden'
  }

  // Behind the bag while travelling through its opening; above it once out.
  const zFor = (id: string, index: number, mode: ObjectMode) => {
    if (id === dragging) return 45
    if (id === active) return 40
    if (mode !== 'rest') return 5 + index
    return 21 + stack.indexOf(id)
  }

  const activeItem = ITEMS.find((i) => i.id === active)
  const isOut = phase === 'opening' || phase === 'open' || phase === 'packing'
  const peekHint = stage.mobile ? 'tap anything to peek' : 'hover over anything to peek'

  const summary = `${ITEMS.length} ${PROFILE.summary}`

  return (
    <main
      className="scene"
      // Shadows and other details scale with the composition.
      style={{ '--u': stage.unit } as CSSProperties}
      onClick={() => setActive(null)}
    >
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
            {isOut && (
              <div className="hud-id">
                <motion.h1 layoutId="title" transition={SHARED} className="hud-title">
                  What’s in my bag?
                </motion.h1>
                <motion.p layoutId="summary" transition={SHARED} className="summary">
                  {summary}
                </motion.p>
              </div>
            )}
            <div className="hud-right">
              <AnimatePresence>
                {isOut && (
                  <motion.div
                    className="status"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
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
                    <div className="counter" aria-live="polite">
                      <span className="counter-slots" aria-hidden>
                        {ITEMS.map((i) => {
                          const thumb = found.has(i.id) && assets.items[i.id]
                          return (
                            <span key={i.id} className="counter-slot" data-name={thumb ? i.name : undefined}>
                              {thumb ? (
                                <motion.img
                                  src={thumb}
                                  alt=""
                                  draggable={false}
                                  initial={{ scale: 0.2, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                                />
                              ) : (
                                <i />
                              )}
                            </span>
                          )
                        })}
                      </span>
                      <span className="counter-label">
                        {found.size} of {ITEMS.length} found
                      </span>
                    </div>
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
                ref={intro}
                className="intro"
                style={{ top: groupTop }}
                // Stay mounted briefly so the shared title can glide away.
                exit={{ opacity: 1, transition: { duration: 0.3 } }}
              >
                <motion.h1 layoutId="title" transition={SHARED} className="intro-title">
                  What’s in my bag?
                </motion.h1>
                <motion.p layoutId="summary" transition={SHARED} className="summary">
                  {summary}
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {phase === 'closed' && (
              <motion.p
                key="credit"
                className="credit"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.4, duration: 0.5 } }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
              >
                Made with <span aria-label="love">♥</span> by Gloria
              </motion.p>
            )}
          </AnimatePresence>

          {ITEMS.map((item, index) => {
            const mode = modeFor(item.id)
            return (
              <BagObject
                key={item.id}
                item={item}
                index={index}
                count={ITEMS.length}
                stage={stage}
                mode={mode}
                src={assets.items[item.id]}
                contents={assets.contents}
                interactive={
                  !packed.has(item.id) && (phase === 'open' || (phase === 'opening' && settled.has(item.id)))
                }
                active={active === item.id}
                dimmed={!!active && active !== item.id}
                unseen={!found.has(item.id)}
                dragging={dragging === item.id}
                zIndex={zFor(item.id, index, mode)}
                onSettled={onSettled}
                onPacked={onPacked}
                onHoverStart={onHoverStart}
                onHoverEnd={onHoverEnd}
                onSelect={onSelect}
                onFocusIn={onFocusIn}
                onFocusOut={onFocusOut}
                onDragStart={onDragStart}
                onDrag={onDrag}
                onDragEnd={onDragEnd}
                registerRef={(id, el) => (el ? buttons.current.set(id, el) : buttons.current.delete(id))}
              />
            )
          })}

          {(phase !== 'closed' || introHeight > 0) && (
            <Bag
              stage={stage}
              open={isOut}
              canOpen={phase === 'closed'}
              canPack={phase === 'open' && !dragging}
              dropTarget={overBag}
              dimmed={!!active}
              shift={bagShift}
              closedSrc={assets.bagClosed}
              openSrc={assets.bagOpen}
              onOpen={openBag}
              onPack={() => pack(false)}
            />
          )}

          <AnimatePresence>
            {activeItem && anchor && !dragging && (
              <StoryCard
                key={activeItem.id}
                item={activeItem}
                anchor={anchor}
                mobile={stage.mobile}
                onShown={markFound}
              />
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
