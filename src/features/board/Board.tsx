import { motion } from 'motion/react'
import type { CSSProperties } from 'react'
import { useBoardStore } from '../notes/store'
import { Pane } from './Pane'
import type { PaneNode } from './types'
import { useCutGesture } from './useCutGesture'

type TreeProps = {
  node: PaneNode
  gesture: ReturnType<typeof useCutGesture>
}

function PaneTree({ node, gesture }: TreeProps) {
  const notes = useBoardStore((s) => s.notes)
  const focusedNoteId = useBoardStore((s) => s.focusedNoteId)
  const cutMode = useBoardStore((s) => s.cutMode)
  const cutAnchor = useBoardStore((s) => s.cutAnchor)
  const cutPreview = useBoardStore((s) => s.cutPreview)
  const setFocusedNoteId = useBoardStore((s) => s.setFocusedNoteId)
  const updateNoteBody = useBoardStore((s) => s.updateNoteBody)

  if (node.type === 'leaf') {
    const note = notes[node.noteId]
    if (!note) return null
    return (
      <Pane
        note={note}
        focused={focusedNoteId === note.id}
        cutMode={cutMode}
        cutAnchor={cutAnchor?.noteId === note.id ? cutAnchor : null}
        cutPreview={cutPreview}
        onFocus={setFocusedNoteId}
        onChange={updateNoteBody}
        {...gesture}
      />
    )
  }

  return (
    <motion.div
      className={`pane-split pane-split--${node.direction}`}
      layout
      transition={{ type: 'spring', stiffness: 320, damping: 34, mass: 0.7 }}
      style={
        {
          '--split-ratio': String(node.ratio),
        } as CSSProperties
      }
    >
      <div className="pane-split__child pane-split__child--first">
        <PaneTree node={node.first} gesture={gesture} />
      </div>
      <div className="pane-gutter" aria-hidden />
      <div className="pane-split__child pane-split__child--second">
        <PaneTree node={node.second} gesture={gesture} />
      </div>
    </motion.div>
  )
}

export function Board() {
  const root = useBoardStore((s) => s.root)
  const cutMode = useBoardStore((s) => s.cutMode)
  const cutAnchor = useBoardStore((s) => s.cutAnchor)
  const setCutAnchor = useBoardStore((s) => s.setCutAnchor)
  const setCutPreview = useBoardStore((s) => s.setCutPreview)
  const commitCut = useBoardStore((s) => s.commitCut)

  const gesture = useCutGesture({
    enabled: cutMode,
    anchor: cutAnchor,
    onPlaceAnchor: setCutAnchor,
    onPreview: setCutPreview,
    onCommit: commitCut,
  })

  return (
    <div
      className={`board${cutMode ? ' board--cut' : ''}${cutAnchor ? ' board--anchored' : ''}`}
    >
      <PaneTree node={root} gesture={gesture} />
    </div>
  )
}
