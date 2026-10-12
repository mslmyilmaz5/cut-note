import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import type { BoardTheme } from '../features/board/types'
import { useBoardStore } from '../features/notes/store'

const GROW_S = 0.9
const FADE_S = 0.35
const VEIL_IN_S = 0.18
const VEIL_HOLD_S = 0.12
const SWAP_AT = 0.55
/** Orb leads; particles spray once the surge is underway. */
const PARTICLE_START_S = GROW_S * 0.4
/** Keep sparks visible after they launch before the solid veil lands. */
const PARTICLE_HOLD_S = 0.95
const EXPONENTIAL_EASE: [number, number, number, number] = [0.7, 0, 0.88, 0.12]
const PARTICLE_COUNT = 56

type Particle = {
  angle: number
  dist: number
  size: number
  delay: number
  duration: number
  spin: number
}

function coverScale(): number {
  const w = window.innerWidth || 1200
  const h = window.innerHeight || 800
  return (Math.hypot(w, h) / 96) * 1.7
}

/** Fixed angles/rings; distances stretch to the viewport edges. */
function buildParticles(): Particle[] {
  const w = window.innerWidth || 1200
  const h = window.innerHeight || 800
  const edge = Math.hypot(w, h) * 0.52

  return Array.from({ length: PARTICLE_COUNT }, (_, index) => {
    const t = index / PARTICLE_COUNT
    const ring = index % 4
    const reach = 0.42 + ring * 0.18 + (index % 5) * 0.02
    return {
      angle:
        t * Math.PI * 2 +
        (ring === 1 ? 0.09 : ring === 2 ? -0.07 : ring === 3 ? 0.04 : 0),
      dist: edge * Math.min(reach, 1.05),
      size: 3.5 + (index % 5) * 1.8 + (ring === 3 ? 1.5 : 0),
      delay: (index % 9) * 0.022 + ring * 0.02,
      duration: 1.1 + (index % 6) * 0.08 + ring * 0.05,
      spin: ((index % 2) * 2 - 1) * (20 + (index % 7) * 8),
    }
  })
}

type BurstProps = {
  to: BoardTheme
  onSwap: () => void
  onDone: () => void
}

function ThemeBurst({ to, onSwap, onDone }: BurstProps) {
  const [phase, setPhase] = useState<'burst' | 'veil' | 'fade'>('burst')
  const finished = useRef(false)
  const targetScale = coverScale()
  const particles = buildParticles()

  useEffect(() => {
    finished.current = false

    const finish = () => {
      if (finished.current) return
      finished.current = true
      onSwap()
      onDone()
    }

    const swapTimer = window.setTimeout(() => {
      onSwap()
    }, GROW_S * SWAP_AT * 1000)

    const veilTimer = window.setTimeout(() => {
      setPhase('veil')
      onSwap()
    }, (PARTICLE_START_S + PARTICLE_HOLD_S) * 1000)

    const fadeTimer = window.setTimeout(() => {
      setPhase('fade')
    }, (PARTICLE_START_S + PARTICLE_HOLD_S + VEIL_IN_S + VEIL_HOLD_S) * 1000)

    const doneTimer = window.setTimeout(() => {
      finish()
    }, (PARTICLE_START_S + PARTICLE_HOLD_S + VEIL_IN_S + VEIL_HOLD_S + FADE_S) * 1000)

    // Hard safety: never leave a stuck black/white veil on screen.
    const safetyTimer = window.setTimeout(() => {
      finish()
    }, 4000)

    return () => {
      window.clearTimeout(swapTimer)
      window.clearTimeout(veilTimer)
      window.clearTimeout(fadeTimer)
      window.clearTimeout(doneTimer)
      window.clearTimeout(safetyTimer)
    }
  }, [onSwap, onDone])

  const fading = phase === 'fade'

  return (
    <div className={`theme-reveal theme-reveal--${to}`} aria-hidden>
      <motion.div
        className="theme-reveal__veil"
        initial={{ opacity: 0 }}
        animate={{
          opacity: phase === 'burst' ? 0 : phase === 'veil' ? 1 : 0,
        }}
        transition={{
          duration: phase === 'fade' ? FADE_S : VEIL_IN_S,
          ease: phase === 'fade' ? 'easeOut' : 'easeIn',
        }}
      />

      <div className="theme-reveal__stage">
        {particles.map((particle, index) => {
          const x = Math.cos(particle.angle) * particle.dist
          const y = Math.sin(particle.angle) * particle.dist
          return (
            <motion.span
              key={index}
              className="theme-reveal__particle"
              initial={{ x: 0, y: 0, scale: 0.2, opacity: 0, rotate: 0 }}
              animate={{
                x,
                y,
                scale: fading || phase === 'veil' ? 0 : 1,
                opacity:
                  fading || phase === 'veil' ? 0 : [0, 1, 1, 0.7, 0],
                rotate: particle.spin,
              }}
              transition={{
                duration:
                  fading || phase === 'veil' ? VEIL_IN_S : particle.duration,
                delay:
                  fading || phase === 'veil'
                    ? 0
                    : PARTICLE_START_S + particle.delay,
                ease:
                  fading || phase === 'veil'
                    ? 'easeOut'
                    : [0.16, 0.84, 0.34, 1],
                opacity:
                  fading || phase === 'veil'
                    ? { duration: VEIL_IN_S }
                    : {
                        duration: particle.duration,
                        delay: PARTICLE_START_S + particle.delay,
                        times: [0, 0.12, 0.45, 0.75, 1],
                      },
              }}
              style={{
                width: particle.size,
                height: particle.size,
              }}
            />
          )
        })}

        <motion.div
          className="theme-reveal__orb"
          initial={{ scale: 0.04, opacity: 1 }}
          animate={{
            scale: targetScale,
            opacity: fading ? 0 : 1,
          }}
          transition={
            fading
              ? { duration: FADE_S, ease: 'easeOut' }
              : { duration: GROW_S, ease: EXPONENTIAL_EASE }
          }
        >
          <span className="theme-reveal__core" />
          <span className="theme-reveal__halo" />
        </motion.div>
      </div>
    </div>
  )
}

export function ThemeReveal() {
  const themeReveal = useBoardStore((s) => s.themeReveal)
  const completeThemeReveal = useBoardStore((s) => s.completeThemeReveal)
  const clearThemeReveal = useBoardStore((s) => s.clearThemeReveal)

  return (
    <AnimatePresence>
      {themeReveal ? (
        <ThemeBurst
          key={themeReveal.id}
          to={themeReveal.to}
          onSwap={completeThemeReveal}
          onDone={clearThemeReveal}
        />
      ) : null}
    </AnimatePresence>
  )
}
