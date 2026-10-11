export type NoteFont = 'sans' | 'serif' | 'mono' | 'display'
export type NoteSize = 'sm' | 'md' | 'lg' | 'xl'
export type NoteWeight = 'regular' | 'medium' | 'bold'
export type NoteAlign = 'left' | 'center' | 'right'
export type NoteList = 'none' | 'bullet' | 'number'
export type NoteColor = 'default' | 'muted' | 'warm' | 'rose' | 'sky' | 'moss'

export type NoteStyle = {
  font: NoteFont
  size: NoteSize
  weight: NoteWeight
  align: NoteAlign
  list: NoteList
  color: NoteColor
}

export const DEFAULT_NOTE_STYLE: NoteStyle = {
  font: 'mono',
  size: 'md',
  weight: 'regular',
  align: 'left',
  list: 'none',
  color: 'default',
}

export type Note = {
  id: string
  body: string
  updatedAt: number
  createdAt: number
  style: NoteStyle
}

export type PaneNode =
  | { type: 'leaf'; noteId: string }
  | {
      type: 'split'
      id: string
      direction: 'row' | 'column'
      ratio: number
      first: PaneNode
      second: PaneNode
    }

export type BoardTheme = 'black' | 'white'

export type BoardSnapshot = {
  root: PaneNode
  notes: Record<string, Note>
  focusedNoteId: string
  theme?: BoardTheme
}

export type CutDirection = 'row' | 'column'

export type CutPull = 'left' | 'right' | 'up' | 'down'

export type CutAnchor = {
  noteId: string
  x: number
  y: number
}

export type CutPreview = {
  noteId: string
  direction: CutDirection
  ratio: number
  contentSide: 'first' | 'second'
  origin: number
  tip: number
  pull: CutPull
  phase: 'drawing' | 'severing'
}
