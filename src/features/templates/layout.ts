import { createId } from '../../lib/id'
import { collectNoteIds } from '../board/splitTree'
import { DEFAULT_NOTE_STYLE, type Note, type PaneNode } from '../board/types'
import type { TemplatePane } from './types'

/** Pass `notes` to keep each pane's content in the template. */
export function boardToTemplateLayout(
  root: PaneNode,
  notes?: Record<string, Note>,
): TemplatePane {
  if (root.type === 'leaf') {
    const note = notes?.[root.noteId]
    return note
      ? { type: 'leaf', body: note.body, style: { ...note.style } }
      : { type: 'leaf' }
  }
  return {
    type: 'split',
    direction: root.direction,
    ratio: root.ratio,
    first: boardToTemplateLayout(root.first, notes),
    second: boardToTemplateLayout(root.second, notes),
  }
}

export function templateHasNotes(layout: TemplatePane): boolean {
  if (layout.type === 'leaf') return typeof layout.body === 'string'
  return templateHasNotes(layout.first) || templateHasNotes(layout.second)
}

export function countTemplatePanes(layout: TemplatePane): number {
  if (layout.type === 'leaf') return 1
  return countTemplatePanes(layout.first) + countTemplatePanes(layout.second)
}

export function instantiateTemplate(layout: TemplatePane): {
  root: PaneNode
  notes: Record<string, Note>
  focusedNoteId: string
} {
  const notes: Record<string, Note> = {}
  let firstId: string | null = null

  function walk(node: TemplatePane): PaneNode {
    if (node.type === 'leaf') {
      const now = Date.now()
      const id = createId()
      if (!firstId) firstId = id
      notes[id] = {
        id,
        body: node.body ?? '',
        createdAt: now,
        updatedAt: now,
        style: { ...DEFAULT_NOTE_STYLE, ...node.style },
      }
      return { type: 'leaf', noteId: id }
    }
    return {
      type: 'split',
      id: createId(),
      direction: node.direction,
      ratio: node.ratio,
      first: walk(node.first),
      second: walk(node.second),
    }
  }

  const root = walk(layout)
  const focusedNoteId = firstId ?? collectNoteIds(root)[0]
  return { root, notes, focusedNoteId }
}
