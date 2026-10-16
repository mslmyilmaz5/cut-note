import { AnimatePresence, motion } from 'motion/react'
import { useEffect, type PointerEvent as ReactPointerEvent } from 'react'
import { RichEditor } from '../editor/RichEditor'
import { useBoardStore } from '../notes/store'
import { CutAnchorMarker } from './CutAnchorMarker'
import { CutOverlay } from './CutOverlay'
import { PaneActions } from './PaneActions'
import type { CutAnchor, CutPreview, Note } from './types'

type Props = {
  note: Note
  focused: boolean
  cutMode: boolean
  cutAnchor: CutAnchor | null
  cutPreview: CutPreview | null
  onFocus: (id: string) => void
  onChange: (id: string, body: string) => void
  onPointerDown: (event: ReactPointerEvent<HTMLElement>, noteId: string) => void
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void
  onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void
  onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => void
}

export function Pane({
  note,
  focused,
  cutMode,
  cutAnchor,
  cutPreview,
  onFocus,
  onChange,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: Props) {
  const cutFlashNoteId = useBoardStore((s) => s.cutFlashNoteId)
  const clearCutFlash = useBoardStore((s) => s.clearCutFlash)
  const previewForPane = cutPreview?.noteId === note.id ? cutPreview : null
  const showFlash = cutFlashNoteId === note.id

  useEffect(() => {
    if (!showFlash) return
    const timer = window.setTimeout(() => clearCutFlash(), 320)
    return () => window.clearTimeout(timer)
  }, [showFlash, clearCutFlash])

  return (
    <div
      className={`pane${focused ? ' pane--focused' : ''}${cutMode ? ' pane--cut' : ''}${cutAnchor ? ' pane--anchored' : ''}`}
      onPointerDown={(event) => {
        if (cutMode) onPointerDown(event, note.id)
      }}
      onPointerMove={cutMode ? onPointerMove : undefined}
      onPointerUp={cutMode ? onPointerUp : undefined}
      onPointerCancel={cutMode ? onPointerCancel : undefined}
    >
      {!cutMode && <PaneActions noteId={note.id} />}
      <RichEditor
        noteId={note.id}
        body={note.body}
        editable={!cutMode}
        autofocus={focused && !cutMode}
        placeholder={cutMode ? 'Click to place a cut point…' : 'Start writing…'}
        onFocusNote={onFocus}
        onChangeBody={onChange}
      />
      <AnimatePresence>
        {cutMode && cutAnchor ? (
          <CutAnchorMarker
            key="anchor"
            anchor={cutAnchor}
            activePull={previewForPane?.pull ?? null}
          />
        ) : null}
      </AnimatePresence>
      <CutOverlay preview={previewForPane} active={cutMode} />
      {showFlash ? (
        <motion.div
          className="cut-flash"
          initial={{ opacity: 0.4 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.32, ease: 'easeOut' }}
        />
      ) : null}
    </div>
  )
}
