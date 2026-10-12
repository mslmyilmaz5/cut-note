import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDismiss } from '../../components/useDismiss'
import { DEFAULT_NOTE_STYLE, type NoteStyle } from '../board/types'
import {
  beginStyleDockInteraction,
  endStyleDockInteraction,
  getActiveEditorStyle,
  getActiveEditorTextColor,
  setActiveEditorColor,
  setActiveEditorCustomColor,
  subscribeActiveEditor,
} from '../editor/editorBridge'
import {
  ALIGN_LABEL,
  COLOR_CYCLE,
  COLOR_LABEL,
  FONT_LABEL,
  LIST_LABEL,
  SIZE_LABEL,
  WEIGHT_LABEL,
} from '../notes/format'
import { isPresetColor } from '../editor/styleCommands'
import { useBoardStore, type StyleAction } from '../notes/store'
import { cssColorToHex, normalizeHex } from './colorUtils'

type DockItem = {
  id: Exclude<StyleAction, 'color'>
  label: string
  value: string
  glyph: string
}

type SelectionStyle = { style: NoteStyle; textColor: string | undefined }

function useSelectionStyle(focusedNoteId: string | null): SelectionStyle {
  const [state, setState] = useState<SelectionStyle>({
    style: DEFAULT_NOTE_STYLE,
    textColor: undefined,
  })

  useEffect(() => {
    const sync = () =>
      setState({
        style: getActiveEditorStyle(focusedNoteId),
        textColor: getActiveEditorTextColor(focusedNoteId),
      })
    sync()
    return subscribeActiveEditor(sync)
  }, [focusedNoteId])

  return state
}

export function StyleDock() {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  useDismiss(rootRef, open, close)
  const cutMode = useBoardStore((s) => s.cutMode)
  const focusedNoteId = useBoardStore((s) => s.focusedNoteId)
  const cycleFocusedStyle = useBoardStore((s) => s.cycleFocusedStyle)
  const { style, textColor } = useSelectionStyle(focusedNoteId)
  const isCustom =
    Boolean(textColor) && !COLOR_CYCLE.some((color) => isPresetColor(textColor, color))
  const currentHex = cssColorToHex(textColor)
  // null = show the selection's color; a string = the user is typing a hex.
  const [hexDraft, setHexDraft] = useState<string | null>(null)

  const applyHex = (value: string) => {
    const hex = normalizeHex(value)
    if (hex) setActiveEditorCustomColor(hex, focusedNoteId)
    setHexDraft(null)
  }

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

  const disabled = cutMode || !focusedNoteId

  return (
    // `.style-dock` is checked by the editor's blur handler to keep the selection.
    <div
      ref={rootRef}
      className="style-dock"
      onPointerDownCapture={() => beginStyleDockInteraction()}
      onPointerUpCapture={() => endStyleDockInteraction()}
      onPointerCancelCapture={() => endStyleDockInteraction()}
    >
      <button
        type="button"
        className={`toolbar-btn${open ? ' toolbar-btn--active' : ''}`}
        aria-label="Text style"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Text style"
        disabled={disabled}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="style-dock__mark">Aa</span>
        <span
          className={`style-dock__swatch style-dock__swatch--${isCustom ? 'custom' : style.color} style-dock__swatch--sm`}
          style={isCustom ? { background: textColor } : undefined}
          aria-hidden
        />
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
          <path
            d="M2.5 4 5 6.5 7.5 4"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <AnimatePresence>
        {open && !disabled ? (
          <motion.div
            className="toolbar-menu toolbar-menu--center style-dock__menu"
            role="menu"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14 }}
          >
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                className="toolbar-menu__item style-dock__item"
                title={`Change ${item.label.toLowerCase()}`}
                onMouseDown={(event) => {
                  // Keep editor selection while clicking style controls.
                  event.preventDefault()
                  beginStyleDockInteraction()
                }}
                onClick={() => {
                  cycleFocusedStyle(item.id)
                  endStyleDockInteraction()
                }}
              >
                <span className="style-dock__glyph">{item.glyph}</span>
                <span className="style-dock__label">{item.label}</span>
                <span className="style-dock__value">{item.value}</span>
              </button>
            ))}
            <div className="style-dock__colors" role="group" aria-label="Text color">
              <span className="style-dock__colors-label">Color</span>
              {COLOR_CYCLE.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`style-dock__color${isPresetColor(textColor, color) ? ' style-dock__color--on' : ''}`}
                  aria-label={COLOR_LABEL[color]}
                  aria-pressed={isPresetColor(textColor, color)}
                  title={COLOR_LABEL[color]}
                  onMouseDown={(event) => {
                    event.preventDefault()
                    beginStyleDockInteraction()
                  }}
                  onClick={() => {
                    setActiveEditorColor(color, focusedNoteId)
                    endStyleDockInteraction()
                  }}
                >
                  <span className={`style-dock__swatch style-dock__swatch--${color}`} />
                </button>
              ))}
            </div>
            <div className="style-dock__custom">
              <span className="style-dock__colors-label">Custom</span>
              <label
                className={`style-dock__picker${isCustom ? ' style-dock__picker--on' : ''}`}
                title="Pick any color"
              >
                <span
                  className="style-dock__picker-fill"
                  style={{ background: currentHex }}
                />
                <input
                  type="color"
                  aria-label="Pick any color"
                  value={currentHex}
                  // Fires continuously while dragging in the picker.
                  onChange={(event) =>
                    setActiveEditorCustomColor(event.target.value, focusedNoteId)
                  }
                />
              </label>
              <input
                className="style-dock__hex"
                aria-label="Hex color"
                spellCheck={false}
                maxLength={7}
                value={hexDraft ?? currentHex}
                onChange={(event) => setHexDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    applyHex(event.currentTarget.value)
                  }
                }}
                onBlur={(event) => {
                  if (hexDraft !== null) applyHex(event.currentTarget.value)
                }}
              />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
