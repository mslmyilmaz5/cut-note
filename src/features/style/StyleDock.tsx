import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { DEFAULT_NOTE_STYLE, type NoteStyle } from '../board/types'
import {
  beginStyleDockInteraction,
  endStyleDockInteraction,
  getActiveEditorStyle,
  subscribeActiveEditor,
} from '../editor/editorBridge'
import {
  ALIGN_LABEL,
  COLOR_LABEL,
  FONT_LABEL,
  LIST_LABEL,
  SIZE_LABEL,
  WEIGHT_LABEL,
} from '../notes/format'
import { useBoardStore, type StyleAction } from '../notes/store'

type DockItem = {
  id: StyleAction
  label: string
  value: string
  glyph: string
  swatch?: string
}

const RADIUS = 148

function itemPosition(index: number, total: number) {
  const start = (172 * Math.PI) / 180
  const end = (8 * Math.PI) / 180
  const t = total === 1 ? 0.5 : index / (total - 1)
  const angle = start + (end - start) * t
  return {
    x: Math.cos(angle) * RADIUS,
    y: -Math.sin(angle) * RADIUS,
  }
}

function useSelectionStyle(focusedNoteId: string | null): NoteStyle {
  const [style, setStyle] = useState<NoteStyle>(DEFAULT_NOTE_STYLE)

  useEffect(() => {
    const sync = () => setStyle(getActiveEditorStyle(focusedNoteId))
    sync()
    return subscribeActiveEditor(sync)
  }, [focusedNoteId])

  return style
}

export function StyleDock() {
  const [open, setOpen] = useState(false)
  const cutMode = useBoardStore((s) => s.cutMode)
  const focusedNoteId = useBoardStore((s) => s.focusedNoteId)
  const cycleFocusedStyle = useBoardStore((s) => s.cycleFocusedStyle)
  const style = useSelectionStyle(focusedNoteId)

  const items = useMemo<DockItem[]>(
    () => [
      {
        id: 'font',
        label: 'Type',
        value: FONT_LABEL[style.font],
        glyph: 'Aa',
      },
      {
        id: 'size',
        label: 'Size',
        value: SIZE_LABEL[style.size],
        glyph: 'Sz',
      },
      {
        id: 'weight',
        label: 'Style',
        value: WEIGHT_LABEL[style.weight],
        glyph: 'B',
      },
      {
        id: 'color',
        label: 'Color',
        value: COLOR_LABEL[style.color],
        glyph: '',
        swatch: style.color,
      },
      {
        id: 'align',
        label: 'Align',
        value: ALIGN_LABEL[style.align],
        glyph: '≡',
      },
      {
        id: 'list',
        label: 'List',
        value: LIST_LABEL[style.list],
        glyph: '•',
      },
    ],
    [style],
  )

  if (cutMode || !focusedNoteId) return null

  return (
    <div className={`style-dock${open ? ' style-dock--open' : ''}`}>
      <div
        className="style-dock__zone"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocusCapture={() => setOpen(true)}
        onBlurCapture={(event) => {
          if (
            !event.currentTarget.contains(event.relatedTarget as Node | null)
          ) {
            setOpen(false)
          }
        }}
        onPointerDownCapture={() => {
          beginStyleDockInteraction()
        }}
        onPointerUpCapture={() => {
          endStyleDockInteraction()
        }}
        onPointerCancelCapture={() => {
          endStyleDockInteraction()
        }}
      >
        <AnimatePresence>
          {open ? (
            <motion.div
              className="style-dock__orbit"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
            >
              <span className="style-dock__ring" aria-hidden />
              {items.map((item, index) => {
                const pos = itemPosition(index, items.length)
                return (
                  <motion.button
                    key={item.id}
                    type="button"
                    className="style-dock__item"
                    title={`${item.label}: ${item.value}`}
                    aria-label={`${item.label}, ${item.value}`}
                    initial={{ opacity: 0, x: 0, y: 24, scale: 0.7 }}
                    animate={{ opacity: 1, x: pos.x, y: pos.y, scale: 1 }}
                    exit={{ opacity: 0, x: 0, y: 16, scale: 0.75 }}
                    transition={{
                      type: 'spring',
                      stiffness: 420,
                      damping: 26,
                      delay: index * 0.025,
                    }}
                    onMouseDown={(event) => {
                      // Keep editor selection while clicking dock controls.
                      event.preventDefault()
                      beginStyleDockInteraction()
                    }}
                    onClick={() => {
                      cycleFocusedStyle(item.id)
                      endStyleDockInteraction()
                    }}
                  >
                    {item.swatch ? (
                      <span
                        className={`style-dock__swatch style-dock__swatch--${item.swatch}`}
                      />
                    ) : (
                      <span className="style-dock__glyph">{item.glyph}</span>
                    )}
                    <span className="style-dock__meta">
                      <span className="style-dock__label">{item.label}</span>
                      <span className="style-dock__value">{item.value}</span>
                    </span>
                  </motion.button>
                )
              })}
            </motion.div>
          ) : null}
        </AnimatePresence>

        <button
          type="button"
          className="style-dock__trigger"
          aria-label="Formatting menu"
          aria-expanded={open}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="style-dock__trigger-cap" />
          <span className="style-dock__trigger-mark">Aa</span>
        </button>
      </div>
    </div>
  )
}
