import { useEffect, useState } from 'react'
import { BAG, type BagItem } from '../data/bag'

export type Stage = {
  width: number
  height: number
  mobile: boolean
  /** Scale factor applied to design-pixel sizes. */
  unit: number
  /** cx/cy is the composition centre (the bag's body); top is the artwork's top edge. */
  bag: { cx: number; cy: number; top: number; width: number; height: number; mouthY: number }
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

function measure(): Stage {
  const width = window.innerWidth
  const height = window.innerHeight
  const mobile = width < 760
  const unit = mobile
    ? clamp(Math.min(width / 390, height / 780), 0.78, 1.35)
    : clamp(Math.min(width / 1440, height / 900), 0.74, 1.4)
  const bagWidth = (mobile ? 190 : 310) * unit
  const bagHeight = bagWidth * BAG.aspect
  const cx = width / 2
  const cy = height * (mobile ? 0.52 : 0.54)
  const top = cy - bagHeight * BAG.focus
  return {
    width,
    height,
    mobile,
    unit,
    bag: { cx, cy, top, width: bagWidth, height: bagHeight, mouthY: top + bagHeight * BAG.mouth },
  }
}

export function useStage() {
  const [stage, setStage] = useState(measure)
  useEffect(() => {
    let frame = 0
    const onResize = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => setStage(measure()))
    }
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
    }
  }, [])
  return stage
}

/** Final resting position (centre point) and size of an item on this stage. */
export function placeItem(item: BagItem, stage: Stage) {
  const p = stage.mobile ? item.mobile : item.desktop
  // Cap the spread so ultra-wide screens keep the composition tight.
  const spreadX = Math.min(stage.width, 1500)
  const spreadY = Math.min(stage.height, stage.mobile ? 900 : 1000)
  return {
    x: stage.bag.cx + p.x * spreadX,
    y: stage.bag.cy + p.y * spreadY,
    rotate: p.rotate,
    width: p.width * stage.unit,
  }
}
