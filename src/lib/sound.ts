/**
 * Tiny synthesized sound kit (Web Audio) — no audio files to ship.
 * Every sound is quiet and short; the whole kit respects a persisted mute.
 */

const MUTE_KEY = 'bag:muted'

let ctx: AudioContext | null = null
let noise: AudioBuffer | null = null
let muted = readMuted()

function readMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

function audio(): AudioContext | null {
  if (muted) return null
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function noiseBuffer(c: AudioContext) {
  if (noise) return noise
  noise = c.createBuffer(1, c.sampleRate, c.sampleRate)
  const data = noise.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  return noise
}

function envelope(c: AudioContext, peak: number, attack: number, release: number, at = c.currentTime) {
  const g = c.createGain()
  g.gain.setValueAtTime(0, at)
  g.gain.linearRampToValueAtTime(peak, at + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, at + attack + release)
  g.connect(c.destination)
  return g
}

export const sound = {
  isMuted: () => muted,

  setMuted(next: boolean) {
    muted = next
    try {
      localStorage.setItem(MUTE_KEY, next ? '1' : '0')
    } catch {
      /* storage unavailable — keep in memory only */
    }
  },

  /** Call from a user gesture so later sounds are allowed to play. */
  unlock() {
    audio()
  },

  /** Soft wooden tick on hover, pitched per object. */
  tick(tone = 0) {
    const c = audio()
    if (!c) return
    const osc = c.createOscillator()
    osc.type = 'triangle'
    osc.frequency.value = 660 * 2 ** (tone / 12)
    const g = envelope(c, 0.05, 0.004, 0.09)
    osc.connect(g)
    osc.start()
    osc.stop(c.currentTime + 0.12)
  },

  /** Little pop as each object leaves the bag. */
  pop(index = 0) {
    const c = audio()
    if (!c) return
    const osc = c.createOscillator()
    osc.type = 'sine'
    const base = 320 + index * 38
    osc.frequency.setValueAtTime(base, c.currentTime)
    osc.frequency.exponentialRampToValueAtTime(base * 2.2, c.currentTime + 0.07)
    const g = envelope(c, 0.06, 0.005, 0.12)
    osc.connect(g)
    osc.start()
    osc.stop(c.currentTime + 0.15)
  },

  /** Zipper-ish rasp when the bag opens. */
  zip() {
    const c = audio()
    if (!c) return
    const src = c.createBufferSource()
    src.buffer = noiseBuffer(c)
    const band = c.createBiquadFilter()
    band.type = 'bandpass'
    band.Q.value = 1.4
    band.frequency.setValueAtTime(1800, c.currentTime)
    band.frequency.linearRampToValueAtTime(3600, c.currentTime + 0.38)
    // Chop the noise into teeth.
    const teeth = c.createGain()
    const lfo = c.createOscillator()
    lfo.type = 'square'
    lfo.frequency.value = 46
    const depth = c.createGain()
    depth.gain.value = 0.5
    lfo.connect(depth).connect(teeth.gain)
    teeth.gain.value = 0.5
    const g = envelope(c, 0.09, 0.03, 0.4)
    src.connect(band).connect(teeth).connect(g)
    src.start()
    lfo.start()
    src.stop(c.currentTime + 0.5)
    lfo.stop(c.currentTime + 0.5)
  },

  /** Airy whoosh when everything goes back in. */
  whoosh() {
    const c = audio()
    if (!c) return
    const src = c.createBufferSource()
    src.buffer = noiseBuffer(c)
    const band = c.createBiquadFilter()
    band.type = 'bandpass'
    band.Q.value = 0.9
    band.frequency.setValueAtTime(1400, c.currentTime)
    band.frequency.exponentialRampToValueAtTime(380, c.currentTime + 0.6)
    const g = envelope(c, 0.07, 0.12, 0.55)
    src.connect(band).connect(g)
    src.start()
    src.stop(c.currentTime + 0.8)
  },

  /** Three-note chime for “you found everything”. */
  chime() {
    const c = audio()
    if (!c) return
    ;[880, 1108.73, 1318.51, 1760].forEach((freq, i) => {
      const at = c.currentTime + i * 0.09
      const osc = c.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq
      const g = envelope(c, 0.045, 0.01, 1.1, at)
      osc.connect(g)
      osc.start(at)
      osc.stop(at + 1.2)
    })
  },
}
