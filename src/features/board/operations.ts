import type { BoardSnapshot, CutDirection } from './types'
import { collectNoteIds, removeNoteFromTree, splitLeaf } from './splitTree'
import { toNoteHtml } from '../editor/contentCut'

export type PanePlacement = 'left' | 'right' | 'above' | 'below'

export function movePane(snapshot: BoardSnapshot, sourceId: string, targetId: string, placement: PanePlacement): BoardSnapshot | null {
  const ids = collectNoteIds(snapshot.root)
  if (sourceId === targetId || !ids.includes(sourceId) || !ids.includes(targetId)) return null
  const root = removeNoteFromTree(snapshot.root, sourceId)
  if (!root) return null
  const direction: CutDirection = placement === 'left' || placement === 'right' ? 'row' : 'column'
  return {
    ...snapshot,
    root: splitLeaf(root, targetId, direction, 0.5, placement === 'left' || placement === 'above' ? 'second' : 'first', sourceId),
    focusedNoteId: sourceId,
  }
}

export function mergePanes(snapshot: BoardSnapshot, sourceId: string, targetId: string): BoardSnapshot | null {
  const ids = collectNoteIds(snapshot.root)
  if (sourceId === targetId || !ids.includes(sourceId) || !ids.includes(targetId)) return null
  const source = snapshot.notes[sourceId]
  const target = snapshot.notes[targetId]
  const root = removeNoteFromTree(snapshot.root, sourceId)
  if (!root || !source || !target) return null
  const notes = { ...snapshot.notes }
  notes[targetId] = { ...target, body: toNoteHtml(target.body) + toNoteHtml(source.body), updatedAt: Date.now() }
  delete notes[sourceId]
  return { ...snapshot, root, notes, focusedNoteId: targetId }
}
