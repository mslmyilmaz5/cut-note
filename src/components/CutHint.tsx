import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useBoardStore } from '../features/notes/store'

const SHOW_MS = 3200

type Hint = { id: number; kind: 'on' | 'off' }

/**
 * Persistent bottom-left info control for the cut shortcut, plus brief
 * on/off toasts when cut mode toggles.
 */
export function CutHint() {
  const [hint, setHint] = useState<Hint | null>(null)

  useEffect(
    () =>
      useBoardStore.subscribe((state, prev) => {
        if (state.cutMode === prev.cutMode) return
        setHint({ id: Date.now(), kind: state.cutMode ? 'on' : 'off' })
      }),
    [],
  )

  useEffect(() => {
    if (!hint) return
    const timer = window.setTimeout(() => setHint(null), SHOW_MS)
    return () => window.clearTimeout(timer)
  }, [hint])

  return (
    <>
      <div className="cut-info">
        <div className="cut-info__tip" role="tooltip" id="cut-info-tip">
          Press <kbd>Tab</kbd>
          <kbd>Tab</kbd> quickly to enter cut mode, then click and drag to
          split a pane.
        </div>
        <button
          type="button"
          className="cut-info__btn"
          aria-label="Cut mode tip"
          aria-describedby="cut-info-tip"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden
          >
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.25" />
            <path
              d="M7 6.2V10"
              stroke="currentColor"
              strokeWidth="1.35"
              strokeLinecap="round"
            />
            <circle cx="7" cy="4.2" r="0.75" fill="currentColor" />
          </svg>
        </button>
      </div>

      <div className="cut-hint-layer" aria-live="polite">
        <AnimatePresence>
          {hint ? (
            <motion.div
              key={hint.id}
              className={`cut-hint cut-hint--${hint.kind}`}
              role="status"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.18 }}
            >
              {hint.kind === 'on' ? (
                <>
                  <span className="cut-hint__title">Cut mode on</span>
                  <span className="cut-hint__text">
                    Click a note to place a cut point, then drag.
                  </span>
                  <span className="cut-hint__keys">
                    <kbd>Tab</kbd>
                    <kbd>Tab</kbd> or <kbd>Esc</kbd> to exit
                  </span>
                </>
              ) : (
                <span className="cut-hint__title">Cut mode off</span>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </>
  )
}
