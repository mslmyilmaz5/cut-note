import {
  DEFAULT_NOTE_STYLE,
  type Note,
  type NoteAlign,
  type NoteColor,
  type NoteFont,
  type NoteList,
  type NoteSize,
  type NoteStyle,
  type NoteWeight,
} from '../board/types'

export const FONT_CYCLE: NoteFont[] = ['sans', 'serif', 'mono', 'display']
export const SIZE_CYCLE: NoteSize[] = ['sm', 'md', 'lg', 'xl']
export const WEIGHT_CYCLE: NoteWeight[] = ['regular', 'medium', 'bold']
export const ALIGN_CYCLE: NoteAlign[] = ['left', 'center', 'right']
export const LIST_CYCLE: NoteList[] = ['none', 'bullet', 'number']
export const COLOR_CYCLE: NoteColor[] = [
  'default',
  'muted',
  'warm',
  'rose',
  'sky',
  'moss',
]

export const FONT_LABEL: Record<NoteFont, string> = {
  sans: 'Sans',
  serif: 'Serif',
  mono: 'Mono',
  display: 'Display',
}

export const SIZE_LABEL: Record<NoteSize, string> = {
  sm: 'S',
  md: 'M',
  lg: 'L',
  xl: 'XL',
}

export const WEIGHT_LABEL: Record<NoteWeight, string> = {
  regular: 'Reg',
  medium: 'Med',
  bold: 'Bold',
}

export const ALIGN_LABEL: Record<NoteAlign, string> = {
  left: 'Left',
  center: 'Center',
  right: 'Right',
}

export const LIST_LABEL: Record<NoteList, string> = {
  none: 'None',
  bullet: 'Bullets',
  number: 'Numbers',
}

export const COLOR_LABEL: Record<NoteColor, string> = {
  default: 'Ink',
  muted: 'Muted',
  warm: 'Warm',
  rose: 'Rose',
  sky: 'Sky',
  moss: 'Moss',
}

export function normalizeStyle(style?: Partial<NoteStyle> | null): NoteStyle {
  return {
    font: style?.font ?? DEFAULT_NOTE_STYLE.font,
    size: style?.size ?? DEFAULT_NOTE_STYLE.size,
    weight: style?.weight ?? DEFAULT_NOTE_STYLE.weight,
    align: style?.align ?? DEFAULT_NOTE_STYLE.align,
    list: style?.list ?? DEFAULT_NOTE_STYLE.list,
    color: style?.color ?? DEFAULT_NOTE_STYLE.color,
  }
}

export function normalizeNote(
  note: Omit<Note, 'style'> & { style?: Partial<NoteStyle> | null },
): Note {
  return {
    ...note,
    style: normalizeStyle(note.style),
  }
}

export function cycleValue<T>(values: T[], current: T): T {
  const index = values.indexOf(current)
  return values[(index + 1 + values.length) % values.length]
}

const BULLET_RE = /^\s*[-*•]\s+/
const NUMBER_RE = /^\s*\d+\.\s+/

export function applyListToBody(body: string, list: NoteList): string {
  const lines = body.split('\n')
  if (list === 'none') {
    return lines
      .map((line) => line.replace(BULLET_RE, '').replace(NUMBER_RE, ''))
      .join('\n')
  }

  return lines
    .map((line, index) => {
      const plain = line.replace(BULLET_RE, '').replace(NUMBER_RE, '')
      if (!plain.trim()) return plain
      if (list === 'bullet') return `• ${plain}`
      return `${index + 1}. ${plain}`
    })
    .join('\n')
}

export function continueListOnEnter(
  body: string,
  selectionStart: number,
  list: NoteList,
): { body: string; caret: number } | null {
  if (list === 'none') return null

  const before = body.slice(0, selectionStart)
  const after = body.slice(selectionStart)
  const lineStart = before.lastIndexOf('\n') + 1
  const currentLine = before.slice(lineStart)
  const plain = currentLine.replace(BULLET_RE, '').replace(NUMBER_RE, '')

  if (!currentLine.trim()) {
    const cleanedBefore = before.slice(0, lineStart)
    return {
      body: `${cleanedBefore}${after}`,
      caret: cleanedBefore.length,
    }
  }

  let prefix = '• '
  if (list === 'number') {
    const match = currentLine.match(/^\s*(\d+)\.\s+/)
    const next = match ? Number(match[1]) + 1 : 1
    prefix = `${next}. `
  }

  if (!plain.trim()) {
    prefix = list === 'bullet' ? '• ' : '1. '
  }

  const nextBody = `${before}\n${prefix}${after}`
  return {
    body: nextBody,
    caret: before.length + 1 + prefix.length,
  }
}
