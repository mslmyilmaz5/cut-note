import type { Editor } from '@tiptap/react'
import type {
  NoteAlign,
  NoteColor,
  NoteFont,
  NoteList,
  NoteSize,
  NoteStyle,
  NoteWeight,
} from '../board/types'
import { DEFAULT_NOTE_STYLE } from '../board/types'
import {
  ALIGN_CYCLE,
  COLOR_CYCLE,
  cycleValue,
  FONT_CYCLE,
  LIST_CYCLE,
  SIZE_CYCLE,
  WEIGHT_CYCLE,
} from '../notes/format'
import type { StyleAction } from '../notes/store'
import { ensureWordSelection } from './selection'

const FONT_CSS: Record<NoteFont, string> = {
  sans: '"IBM Plex Sans", "Avenir Next", sans-serif',
  serif: '"Source Serif 4", Georgia, serif',
  mono: '"IBM Plex Mono", Menlo, monospace',
  display: 'Fraunces, Georgia, serif',
}

const SIZE_CSS: Record<NoteSize, string> = {
  sm: '13px',
  md: '15px',
  lg: '18px',
  xl: '24px',
}

const WEIGHT_CSS: Record<NoteWeight, string> = {
  regular: '400',
  medium: '500',
  bold: '700',
}

const COLOR_CSS: Record<NoteColor, string> = {
  default: 'var(--ink)',
  muted: 'var(--ink-muted)',
  warm: 'var(--note-warm)',
  rose: 'var(--note-rose)',
  sky: 'var(--note-sky)',
  moss: 'var(--note-moss)',
}

function cssToFont(value: string | undefined): NoteFont {
  if (!value) return DEFAULT_NOTE_STYLE.font
  const lower = value.toLowerCase()
  if (lower.includes('fraunces')) return 'display'
  if (lower.includes('mono') || lower.includes('menlo')) return 'mono'
  // Check sans first: the sans stack ends in "sans-serif".
  if (lower.includes('plex sans') || lower.includes('sans')) return 'sans'
  if (lower.includes('serif')) return 'serif'
  return DEFAULT_NOTE_STYLE.font
}

function cssToSize(value: string | undefined): NoteSize {
  const match = SIZE_CYCLE.find((size) => SIZE_CSS[size] === value)
  return match ?? DEFAULT_NOTE_STYLE.size
}

function cssToWeight(value: string | undefined): NoteWeight {
  if (value === '700' || value === 'bold') return 'bold'
  if (value === '500' || value === '600') return 'medium'
  return 'regular'
}

function cssToColor(value: string | undefined): NoteColor {
  if (!value) return 'default'
  const match = COLOR_CYCLE.find((color) => COLOR_CSS[color] === value)
  if (match) return match
  // Fallback: match resolved-ish tokens
  if (value.includes('muted') || value.includes('--ink-muted')) return 'muted'
  if (value.includes('warm')) return 'warm'
  if (value.includes('rose')) return 'rose'
  if (value.includes('sky')) return 'sky'
  if (value.includes('moss')) return 'moss'
  return 'default'
}

export function readActiveStyle(editor: Editor): NoteStyle {
  const textStyle = editor.getAttributes('textStyle') as {
    fontFamily?: string
    fontSize?: string
    fontWeight?: string
    color?: string
  }

  let align: NoteAlign = 'left'
  if (editor.isActive({ textAlign: 'center' })) align = 'center'
  else if (editor.isActive({ textAlign: 'right' })) align = 'right'

  let list: NoteList = 'none'
  if (editor.isActive('bulletList')) list = 'bullet'
  else if (editor.isActive('orderedList')) list = 'number'

  return {
    font: cssToFont(textStyle.fontFamily),
    size: cssToSize(textStyle.fontSize),
    weight: cssToWeight(textStyle.fontWeight),
    color: cssToColor(textStyle.color),
    align,
    list,
  }
}

function withSelection(editor: Editor) {
  // Keep the current selection; only restore focus without scrolling.
  return editor.chain().focus(undefined, { scrollIntoView: false })
}

/** Apply one specific color to the selection (or the word under the caret). */
export function setEditorColor(editor: Editor, color: NoteColor): void {
  ensureWordSelection(editor)
  withSelection(editor).setColor(COLOR_CSS[color]).run()
}

/**
 * Apply any CSS color (e.g. `#e07a5f`). Doesn't refocus the editor so a color
 * picker or hex field can stay focused while the color updates live.
 */
export function setEditorCustomColor(editor: Editor, css: string): void {
  ensureWordSelection(editor)
  editor.chain().setColor(css).run()
}

/** Raw CSS color at the selection, or undefined for the default ink. */
export function readActiveTextColor(editor: Editor): string | undefined {
  const { color } = editor.getAttributes('textStyle') as { color?: string }
  return color || undefined
}

/** True when `css` is exactly one of the preset colors. */
export function isPresetColor(css: string | undefined, color: NoteColor): boolean {
  if (!css) return color === 'default'
  return COLOR_CSS[color] === css
}

export function cycleEditorStyle(editor: Editor, action: StyleAction): void {
  const current = readActiveStyle(editor)

  // Character styles target the selection / word.
  // Align & list are block-level and must use the full paragraph width.
  if (action !== 'align' && action !== 'list') {
    ensureWordSelection(editor)
  }

  if (action === 'font') {
    const next = cycleValue(FONT_CYCLE, current.font)
    withSelection(editor).setFontFamily(FONT_CSS[next]).run()
    return
  }

  if (action === 'size') {
    const next = cycleValue(SIZE_CYCLE, current.size)
    withSelection(editor).setFontSize(SIZE_CSS[next]).run()
    return
  }

  if (action === 'weight') {
    const next = cycleValue(WEIGHT_CYCLE, current.weight)
    withSelection(editor).setFontWeight(WEIGHT_CSS[next]).run()
    return
  }

  if (action === 'color') {
    const next = cycleValue(COLOR_CYCLE, current.color)
    withSelection(editor).setColor(COLOR_CSS[next]).run()
    return
  }

  if (action === 'align') {
    const next = cycleValue(ALIGN_CYCLE, current.align)
    withSelection(editor).setTextAlign(next).run()
    return
  }

  // list — apply to current block / selected paragraphs
  const next = cycleValue(LIST_CYCLE, current.list)
  if (next === 'none') {
    if (editor.isActive('bulletList')) {
      withSelection(editor).toggleBulletList().run()
    } else if (editor.isActive('orderedList')) {
      withSelection(editor).toggleOrderedList().run()
    }
    return
  }
  if (next === 'bullet') {
    if (editor.isActive('orderedList')) {
      withSelection(editor).toggleOrderedList().toggleBulletList().run()
    } else if (!editor.isActive('bulletList')) {
      withSelection(editor).toggleBulletList().run()
    }
    return
  }
  if (editor.isActive('bulletList')) {
    withSelection(editor).toggleBulletList().toggleOrderedList().run()
  } else if (!editor.isActive('orderedList')) {
    withSelection(editor).toggleOrderedList().run()
  }
}
