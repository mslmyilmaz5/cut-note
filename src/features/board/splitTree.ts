import type { CutDirection, PaneNode } from './types'
import { createId } from '../../lib/id'

const MIN_RATIO = 0.2
const MAX_RATIO = 0.8

export { MIN_RATIO, MAX_RATIO }

export function collectNoteIds(node: PaneNode): string[] {
  if (node.type === 'leaf') return [node.noteId]
  return [...collectNoteIds(node.first), ...collectNoteIds(node.second)]
}

export function findLeafPath(
  node: PaneNode,
  noteId: string,
  path: Array<'first' | 'second'> = [],
): Array<'first' | 'second'> | null {
  if (node.type === 'leaf') {
    return node.noteId === noteId ? path : null
  }
  const left = findLeafPath(node.first, noteId, [...path, 'first'])
  if (left) return left
  return findLeafPath(node.second, noteId, [...path, 'second'])
}

export function splitLeaf(
  root: PaneNode,
  noteId: string,
  direction: CutDirection,
  ratio: number,
  contentSide: 'first' | 'second',
  newNoteId: string,
): PaneNode {
  const clamped = Math.min(MAX_RATIO, Math.max(MIN_RATIO, ratio))

  function walk(node: PaneNode): PaneNode {
    if (node.type === 'leaf') {
      if (node.noteId !== noteId) return node
      const original: PaneNode = { type: 'leaf', noteId }
      const created: PaneNode = { type: 'leaf', noteId: newNoteId }
      return {
        type: 'split',
        id: createId(),
        direction,
        ratio: clamped,
        first: contentSide === 'first' ? original : created,
        second: contentSide === 'first' ? created : original,
      }
    }
    return {
      ...node,
      first: walk(node.first),
      second: walk(node.second),
    }
  }

  return walk(root)
}

export function removeNoteFromTree(
  root: PaneNode,
  noteId: string,
): PaneNode | null {
  if (root.type === 'leaf') {
    return root.noteId === noteId ? null : root
  }

  const first = removeNoteFromTree(root.first, noteId)
  const second = removeNoteFromTree(root.second, noteId)

  if (first === null && second === null) return null
  if (first === null) return second
  if (second === null) return first

  return { ...root, first, second }
}

export function noteTitle(body: string): string {
  const text = body
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
  const line = text.split('\n').find((part) => part.trim().length > 0)
  return line?.trim() || 'Untitled'
}
