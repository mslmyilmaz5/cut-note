import type { BoardSnapshot, BoardTheme, Note, PaneNode } from '../board/types'
import { normalizeNote } from '../notes/format'
import {
  boardToTemplateLayout,
  countTemplatePanes,
  templateHasNotes,
} from '../templates/layout'
import type { BoardTemplate, TemplatePane } from '../templates/types'

export const CUTNOTE_EXTENSION = 'cutnote'
export const CUTNOTE_FORMAT = 'cutnote' as const
export const CUTNOTE_VERSION = 1 as const

export type CutNoteDocument = {
  format: typeof CUTNOTE_FORMAT
  version: typeof CUTNOTE_VERSION
  name: string
  createdAt: number
  theme: BoardTheme
  root: PaneNode
  notes: Record<string, Note>
  focusedNoteId: string
}

export function boardToCutNoteDocument(
  name: string,
  snapshot: BoardSnapshot & { theme: BoardTheme },
  createdAt = Date.now(),
): CutNoteDocument {
  return {
    format: CUTNOTE_FORMAT,
    version: CUTNOTE_VERSION,
    name,
    createdAt,
    theme: snapshot.theme,
    root: structuredClone(snapshot.root),
    notes: structuredClone(snapshot.notes),
    focusedNoteId: snapshot.focusedNoteId,
  }
}

export function serializeCutNote(doc: CutNoteDocument): string {
  return `${JSON.stringify(doc, null, 2)}\n`
}

function isPaneNode(value: unknown): value is PaneNode {
  if (!value || typeof value !== 'object') return false
  const node = value as PaneNode
  if (node.type === 'leaf') return typeof node.noteId === 'string'
  if (node.type === 'split') {
    return (
      typeof node.id === 'string' &&
      (node.direction === 'row' || node.direction === 'column') &&
      typeof node.ratio === 'number' &&
      isPaneNode(node.first) &&
      isPaneNode(node.second)
    )
  }
  return false
}

function isTemplatePane(value: unknown): value is TemplatePane {
  if (!value || typeof value !== 'object') return false
  const node = value as TemplatePane
  if (node.type === 'leaf') return true
  if (node.type === 'split') {
    return (
      (node.direction === 'row' || node.direction === 'column') &&
      typeof node.ratio === 'number' &&
      isTemplatePane(node.first) &&
      isTemplatePane(node.second)
    )
  }
  return false
}

export function parseCutNote(raw: string): CutNoteDocument {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('This file is not a valid Cut Note document.')
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('This file is not a valid Cut Note document.')
  }

  const data = parsed as Partial<CutNoteDocument>

  if (data.format !== CUTNOTE_FORMAT) {
    throw new Error('This file is not a Cut Note (.cutnote) document.')
  }

  if (data.version !== CUTNOTE_VERSION) {
    throw new Error(`Unsupported Cut Note version: ${String(data.version)}`)
  }

  if (typeof data.name !== 'string' || !data.name.trim()) {
    throw new Error('Cut Note document is missing a name.')
  }

  if (!isPaneNode(data.root)) {
    throw new Error('Cut Note document has an invalid layout.')
  }

  if (!data.notes || typeof data.notes !== 'object') {
    throw new Error('Cut Note document is missing notes.')
  }

  const notes = Object.fromEntries(
    Object.entries(data.notes).map(([id, note]) => [
      id,
      normalizeNote(note as Note),
    ]),
  )

  const focusedNoteId =
    typeof data.focusedNoteId === 'string' && notes[data.focusedNoteId]
      ? data.focusedNoteId
      : Object.keys(notes)[0]

  if (!focusedNoteId) {
    throw new Error('Cut Note document has no notes.')
  }

  return {
    format: CUTNOTE_FORMAT,
    version: CUTNOTE_VERSION,
    name: data.name.trim(),
    createdAt:
      typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
    theme: data.theme === 'white' ? 'white' : 'black',
    root: data.root,
    notes,
    focusedNoteId,
  }
}

/** Keep only template fields; strip older `root`/`notes` payloads (layout only). */
export function normalizeTemplate(raw: BoardTemplate & {
  root?: PaneNode
  notes?: unknown
  focusedNoteId?: string
  theme?: BoardTheme
  filePath?: string | null
}): BoardTemplate {
  const layout: TemplatePane = isTemplatePane(raw.layout)
    ? raw.layout
    : raw.root
      ? boardToTemplateLayout(raw.root)
      : { type: 'leaf' }

  return {
    id: raw.id,
    name: raw.name,
    createdAt: raw.createdAt,
    paneCount: countTemplatePanes(layout),
    withNotes: templateHasNotes(layout),
    layout,
  }
}

export function suggestedFileName(name: string): string {
  const slug = name
    .trim()
    .replace(/[^\w\s-]+/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
  return `${slug || 'Untitled'}.${CUTNOTE_EXTENSION}`
}
