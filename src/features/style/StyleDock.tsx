import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDismiss } from '../../components/useDismiss'
import { DEFAULT_NOTE_STYLE, type NoteStyle } from '../board/types'
import {
  beginStyleDockInteraction,
  endStyleDockInteraction,
  getActiveEditorStyle,
  getActiveEditorTextColor,
  getActiveEditorLineHeight,
  setActiveEditorLineHeight,
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
import { DEFAULT_LINE_HEIGHT, LINE_HEIGHT_OPTIONS } from '../editor/lineHeight'

type DockItem = {
  id: Exclude<StyleAction, 'color'>
  label: string
  value: string
  glyph: string
}

type SelectionStyle = { style: NoteStyle; textColor: string | undefined; lineHeight: string }

function useSelectionStyle(focusedNoteId: string | null): SelectionStyle {
  const [state, setState] = useState<SelectionStyle>({
    style: DEFAULT_NOTE_STYLE,
    textColor: undefined,
    lineHeight: DEFAULT_LINE_HEIGHT,
  })

  useEffect(() => {
    const sync = () =>
      setState({
        style: getActiveEditorStyle(focusedNoteId),
        textColor: getActiveEditorTextColor(focusedNoteId),
        lineHeight: getActiveEditorLineHeight(focusedNoteId),
      })
    sync()
    return subscribeActiveEditor(sync)
  }, [focusedNoteId])

  return state
}

export function StyleDock() {
  const [colorOpen, setColorOpen] = useState(false)
  const colorRef = useRef<HTMLDivElement>(null)
  const closeColor = useCallback(() => setColorOpen(false), [])
  useDismiss(colorRef, colorOpen, closeColor)
  const cutMode = useBoardStore((s) => s.cutMode)
  const focusedNoteId = useBoardStore((s) => s.focusedNoteId)
  const cycleFocusedStyle = useBoardStore((s) => s.cycleFocusedStyle)
  const { style, textColor, lineHeight } = useSelectionStyle(focusedNoteId)
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
      className="style-dock"
      aria-label="Text style"
      onPointerDownCapture={() => beginStyleDockInteraction()}
      onPointerUpCapture={() => endStyleDockInteraction()}
      onPointerCancelCapture={() => endStyleDockInteraction()}
    >
      <div className="style-dock__tools">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className="toolbar-btn style-dock__chip"
          title={`${item.label}: ${item.value}`}
          disabled={disabled}
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
      <div className="style-dock__line-height" role="group" aria-label="Paragraph spacing">
        <span className="style-dock__glyph" aria-hidden>↕</span>
        <label className="style-dock__sr" htmlFor="style-line-height">Line height</label>
        <select
          id="style-line-height"
          value={lineHeight}
          disabled={disabled}
          title="Line height"
          onChange={(event) => setActiveEditorLineHeight(event.target.value, focusedNoteId)}
        >
          {lineHeight === '' && <option value="" disabled>Mixed</option>}
          {lineHeight && !LINE_HEIGHT_OPTIONS.includes(lineHeight) && <option value={lineHeight}>{lineHeight}</option>}
          {LINE_HEIGHT_OPTIONS.map((value) => <option key={value} value={value}>{value === DEFAULT_LINE_HEIGHT ? `${value} (Default)` : value}</option>)}
        </select>
      </div>
      </div>
      <div className="style-dock__color-menu" ref={colorRef}>
        <button
          type="button"
          className={`toolbar-btn toolbar-btn--icon style-dock__color-dot${colorOpen ? ' toolbar-btn--active' : ''}`}
          aria-label="Text color"
          aria-haspopup="menu"
          aria-expanded={colorOpen}
          title="Text color"
          disabled={disabled}
          onMouseDown={(event) => {
            event.preventDefault()
            beginStyleDockInteraction()
          }}
          onClick={() => setColorOpen((open) => !open)}
        >
          <span
            className={`style-dock__swatch style-dock__swatch--${isCustom ? 'custom' : style.color}`}
            style={isCustom ? { background: currentHex } : undefined}
          />
        </button>
        {colorOpen && !disabled ? (
          <div className="toolbar-menu style-dock__color-list" role="menu" aria-label="Text color">
            {COLOR_CYCLE.map((color) => (
              <button
                key={color}
                type="button"
                role="menuitem"
                className={`toolbar-menu__item${isPresetColor(textColor, color) ? ' style-dock__color-item--on' : ''}`}
                aria-pressed={isPresetColor(textColor, color)}
                onMouseDown={(event) => {
                  event.preventDefault()
                  beginStyleDockInteraction()
                }}
                onClick={() => {
                  setActiveEditorColor(color, focusedNoteId)
                  endStyleDockInteraction()
                  setColorOpen(false)
                }}
              >
                <span className={`style-dock__swatch style-dock__swatch--${color}`} />
                <span className="toolbar-menu__label">{COLOR_LABEL[color]}</span>
              </button>
            ))}
            <div className="style-dock__custom">
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
          </div>
        ) : null}
      </div>
    </div>
  )
}
