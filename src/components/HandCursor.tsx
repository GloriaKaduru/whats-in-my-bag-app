import { useEffect, useRef, useState } from 'react'
import { HANDS } from '../lib/preload'

/**
 * point – resting
 * reach – over something you can click or pick up
 * press – mouse down on a button
 * grab  – holding (or about to drag) an object
 */
type Pose = 'point' | 'reach' | 'press' | 'grab'

/** Only for a real mouse; touch and pen keep their native behaviour. */
export const canUseHandCursor = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches

/**
 * A photographed hand that replaces the system cursor. It follows the pointer
 * 1:1 (no easing — a trailing cursor feels laggy); only its pose animates.
 * Elements opt into poses with `data-hand="grab"`; any button gets `reach`.
 */
export function HandCursor({ dragging }: { dragging: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const [pose, setPose] = useState<Pose>('point')
  const [visible, setVisible] = useState(false)
  const over = useRef<'grab' | 'button' | null>(null)
  const down = useRef(false)

  useEffect(() => {
    const root = document.documentElement
    root.classList.add('hand-cursor')

    const decide = (): Pose => {
      if (down.current) return over.current === 'grab' ? 'grab' : over.current ? 'press' : 'point'
      return over.current ? 'reach' : 'point'
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return setVisible(false)
      const el = ref.current
      if (el) el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`
      const hit = (e.target as Element | null)?.closest?.('[data-hand], button')
      over.current = hit ? ((hit as HTMLElement).dataset.hand === 'grab' ? 'grab' : 'button') : null
      setVisible(true)
      setPose(decide())
    }
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return setVisible(false)
      down.current = true
      setPose(decide())
    }
    const onUp = () => {
      down.current = false
      setPose(decide())
    }
    const onLeave = () => setVisible(false)

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    root.addEventListener('mouseleave', onLeave)
    return () => {
      root.classList.remove('hand-cursor')
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      root.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <div ref={ref} className="hand" data-pose={dragging ? 'grab' : pose} data-visible={visible || undefined} aria-hidden>
      <div className="hand-pose">
        <img className="hand-point" src={HANDS.point} alt="" draggable={false} />
        <img className="hand-grab" src={HANDS.grab} alt="" draggable={false} />
      </div>
    </div>
  )
}
