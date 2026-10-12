import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useBoardStore } from '../features/notes/store'

const TIP_SEEN_KEY = 'cut-note:tip-double-tab'
const SHOW_MS = 3200
const TIP_MS = 9000

type Hint = { id: number; kind: 'on' | 'off' | 'tip' }

function tipSeen(): boolean {
  try {
    return localStorage.getItem(TIP_SEEN_KEY) === '1'
  } catch {
    return true
  }
}

function markTipSeen() {
  try {
    localStorage.setItem(TIP_SEEN_KEY, '1')
  } catch {
    // Without storage the tip just shows again next launch.
  }
}

/**
 * Cut mode has no toolbar button, so announce it when it toggles and teach the
 * double-Tab shortcut once.
 */
export function CutHint() {
  const [hint, setHint] = useState<Hint | null>(() =>
    tipSeen() ? null : { id: 0, kind: 'tip' },
  )

  useEffect(
    () =>
      useBoardStore.subscribe((state, prev) => {
        if (state.cutMode === prev.cutMode) return
        // Using the shortcut means the tip did its job.
        markTipSeen()
        setHint({ id: Date.now(), kind: state.cutMode ? 'on' : 'off' })
      }),
    [],
  )

  useEffect(() => {
    if (!hint) return
    const timer = window.setTimeout(() => {
      if (hint.kind === 'tip') markTipSeen()
      setHint(null)
    }, hint.kind === 'tip' ? TIP_MS : SHOW_MS)
    return () => window.clearTimeout(timer)
  }, [hint])

  return (
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
            ) : null}
            {hint.kind === 'off' ? (
              <span className="cut-hint__title">Cut mode off</span>
            ) : null}
            {hint.kind === 'tip' ? (
              <>
                <span className="cut-hint__title">Tip</span>
                <span className="cut-hint__text">
                  Press <kbd>Tab</kbd>
                  <kbd>Tab</kbd> quickly to cut a note.
                </span>
                <button
                  type="button"
                  className="cut-hint__close"
                  aria-label="Dismiss tip"
                  onClick={() => {
                    markTipSeen()
                    setHint(null)
                  }}
                >
                  ✕
                </button>
              </>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
