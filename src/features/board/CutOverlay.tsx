import { AnimatePresence, motion } from 'motion/react'
import type { CutPreview } from './types'

type Props = {
  preview: CutPreview | null
  active: boolean
}

function beamSpan(preview: CutPreview) {
  const from = Math.min(preview.origin, preview.tip)
  const to = Math.max(preview.origin, preview.tip)
  return { from, to, length: Math.max(to - from, 0.002) }
}

export function CutOverlay({ preview, active }: Props) {
  const visible = active && preview
  const vertical = preview?.direction === 'row'
  const severing = preview?.phase === 'severing'
  const span = preview ? beamSpan(preview) : null
  const tipAtEnd = preview ? preview.tip >= preview.origin : true

  return (
    <AnimatePresence>
      {visible && preview && span ? (
        <motion.div
          key={`cut-${preview.noteId}-${preview.direction}`}
          className="laser-layer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
        >
          <div
            className={`laser-guide laser-guide--${vertical ? 'vertical' : 'horizontal'}`}
            style={
              vertical
                ? { left: `${preview.ratio * 100}%`, opacity: severing ? 0.55 : 0.28 }
                : { top: `${preview.ratio * 100}%`, opacity: severing ? 0.55 : 0.28 }
            }
          />
          <motion.div
            className={`laser laser--${vertical ? 'vertical' : 'horizontal'}${severing ? ' laser--severing' : ''}`}
            initial={
              vertical
                ? {
                    left: `${preview.ratio * 100}%`,
                    top: `${preview.origin * 100}%`,
                    height: 0,
                  }
                : {
                    top: `${preview.ratio * 100}%`,
                    left: `${preview.origin * 100}%`,
                    width: 0,
                  }
            }
            animate={
              vertical
                ? {
                    left: `${preview.ratio * 100}%`,
                    top: `${span.from * 100}%`,
                    height: `${span.length * 100}%`,
                  }
                : {
                    top: `${preview.ratio * 100}%`,
                    left: `${span.from * 100}%`,
                    width: `${span.length * 100}%`,
                  }
            }
            transition={
              severing
                ? { duration: 0.28, ease: [0.22, 1, 0.36, 1] }
                : { type: 'tween', duration: 0.04, ease: 'linear' }
            }
          >
            <span className="laser__glow" />
            <span className="laser__core" />
            {!severing ? (
              <span
                className="laser__tip"
                style={
                  vertical
                    ? { top: tipAtEnd ? '100%' : '0%', left: '50%' }
                    : { left: tipAtEnd ? '100%' : '0%', top: '50%' }
                }
              />
            ) : (
              <span className="laser__burst" />
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
