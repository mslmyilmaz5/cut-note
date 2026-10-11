import { motion } from 'motion/react'
import { MIN_RATIO, MAX_RATIO } from './splitTree'
import type { CutAnchor, CutPull } from './types'

type Props = {
  anchor: CutAnchor
  activePull: CutPull | null
}

function Arrow({
  pull,
  enabled,
  active,
}: {
  pull: CutPull
  enabled: boolean
  active: boolean
}) {
  return (
    <span
      className={`cut-arrow cut-arrow--${pull}${enabled ? '' : ' cut-arrow--disabled'}${active ? ' cut-arrow--active' : ''}`}
      aria-hidden
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        {pull === 'up' && (
          <path d="M7 11V3M7 3 3.5 6.5M7 3l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        )}
        {pull === 'down' && (
          <path d="M7 3v8M7 11l-3.5-3.5M7 11l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        )}
        {pull === 'left' && (
          <path d="M11 7H3M3 7l3.5-3.5M3 7l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        )}
        {pull === 'right' && (
          <path d="M3 7h8M11 7 7.5 3.5M11 7 7.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    </span>
  )
}

export function CutAnchorMarker({ anchor, activePull }: Props) {
  const verticalOk = anchor.x >= MIN_RATIO && anchor.x <= MAX_RATIO
  const horizontalOk = anchor.y >= MIN_RATIO && anchor.y <= MAX_RATIO

  return (
    <motion.div
      className="cut-anchor"
      style={{ left: `${anchor.x * 100}%`, top: `${anchor.y * 100}%` }}
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
    >
      <span className="cut-anchor__ring" />
      <span className="cut-anchor__dot" />
      <Arrow pull="up" enabled={verticalOk} active={activePull === 'up'} />
      <Arrow pull="down" enabled={verticalOk} active={activePull === 'down'} />
      <Arrow pull="left" enabled={horizontalOk} active={activePull === 'left'} />
      <Arrow pull="right" enabled={horizontalOk} active={activePull === 'right'} />
      {!activePull ? (
        <span className="cut-anchor__hint">Drag to cut</span>
      ) : null}
    </motion.div>
  )
}
