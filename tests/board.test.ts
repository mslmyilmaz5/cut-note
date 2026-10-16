// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Editor } from '@tiptap/react'
import { createEditorExtensions } from '../src/features/editor/extensions'
import { extractEditorContent } from '../src/features/editor/contentCut'
import { registerEditor, unregisterEditor } from '../src/features/editor/editorBridge'
import { mergePanes, movePane } from '../src/features/board/operations'
import { collectNoteIds } from '../src/features/board/splitTree'
import { DEFAULT_NOTE_STYLE, type BoardSnapshot, type Note } from '../src/features/board/types'
import { useBoardStore } from '../src/features/notes/store'

const note = (id: string, body: string): Note => ({ id, body, createdAt: 1, updatedAt: 1, style: { ...DEFAULT_NOTE_STYLE } })
function board(): BoardSnapshot {
  return {
    root: { type: 'split', id: 'outer', direction: 'row', ratio: .3, first: { type: 'leaf', noteId: 'a' }, second: { type: 'split', id: 'inner', direction: 'column', ratio: .6, first: { type: 'leaf', noteId: 'b' }, second: { type: 'leaf', noteId: 'c' } } },
    notes: { a: note('a', '<p>Alpha <strong>bold</strong></p>'), b: note('b', '<ul><li><p>Beta</p></li></ul>'), c: note('c', '<p>Gamma</p>') },
    focusedNoteId: 'a',
  }
}
let editor: Editor | undefined
function makeEditor(content: string) {
  const element = document.createElement('div')
  document.body.append(element)
  editor = new Editor({ element, extensions: createEditorExtensions(''), content })
  return editor
}
beforeEach(() => {
  vi.useFakeTimers()
  useBoardStore.setState({ ...board(), past: [], future: [], focusModeNoteId: null, boardRevision: 0, cutMode: false })
})
afterEach(() => {
  unregisterEditor('a', editor)
  editor?.destroy()
  editor = undefined
  vi.runOnlyPendingTimers()
  vi.useRealTimers()
  document.body.innerHTML = ''
})

describe('content cuts', () => {
  it('extracts a styled selection without changing the live document', () => {
    const e = makeEditor('<p>Alpha <strong>bold</strong> omega</p>')
    e.commands.setTextSelection({ from: 7, to: 11 })
    const cut = extractEditorContent(e)!
    expect(cut.extracted).toBe('<p style="text-align: left;"><strong>bold</strong></p>')
    expect(cut.remaining).toBe('<p style="text-align: left;">Alpha  omega</p>')
    expect(e.getText()).toBe('Alpha bold omega')
  })
  it('cuts from the cursor to the end, retaining list structure and marks', () => {
    const e = makeEditor('<p>Keep</p><ul><li><p>One</p></li><li><p><em>Two</em></p></li></ul>')
    e.commands.setTextSelection(9)
    const cut = extractEditorContent(e)!
    expect(cut.extracted).toContain('<ul>')
    expect(cut.extracted).toContain('<em>Two</em>')
    expect(cut.remaining).toContain('Keep')
    expect(cut.remaining).not.toContain('One')
    e.schema.nodeFromJSON(e.state.doc.toJSON()).check()
    e.commands.setContent(cut.extracted)
    e.state.doc.check()
    expect(e.getText()).toContain('One')
  })
  it('returns no cut for an empty note or cursor at the end', () => {
    const e = makeEditor('<p>End</p>')
    e.commands.setTextSelection(4)
    expect(extractEditorContent(e)).toBeNull()
    e.commands.setContent('<p></p>')
    expect(extractEditorContent(e)).toBeNull()
  })
  it('cuts all text and leaves a valid empty original', () => {
    const e = makeEditor('<p>Hello</p>')
    e.commands.selectAll()
    expect(extractEditorContent(e)).toEqual({ remaining: '<p style="text-align: left;"></p>', extracted: '<p style="text-align: left;">Hello</p>' })
  })
  it('preserves paragraph alignment, color and font size', () => {
    const e = makeEditor('<p style="text-align: center"><span style="color: rgb(255, 0, 0); font-size: 24px">Color</span></p>')
    e.commands.setTextSelection({ from: 1, to: 6 })
    const cut = extractEditorContent(e)!
    expect(cut.extracted).toContain('text-align: center')
    expect(cut.extracted).toContain('font-size: 24px')
    expect(cut.extracted).toContain('color: rgb(255, 0, 0)')
  })
  it('cuts across paragraph boundaries without duplicating text', () => {
    const e = makeEditor('<p>First</p><p>Second</p><p>Third</p>')
    e.commands.setTextSelection({ from: 3, to: 11 })
    const cut = extractEditorContent(e)!
    const plain = (html: string) => {
      const element = document.createElement('div')
      element.innerHTML = html
      return element.textContent
    }
    expect(plain(cut.extracted)).toBe('rstSec')
    expect(plain(cut.remaining)).toBe('FiondThird')
    e.commands.setContent(cut.remaining)
    e.state.doc.check()
  })
})

describe('moving and merging nested panes', () => {
  it.each(['left', 'right', 'above', 'below'] as const)('moves a nested note %s without losing notes', (placement) => {
    const before = board()
    const next = movePane(before, 'c', 'a', placement)!
    expect(collectNoteIds(next.root).sort()).toEqual(['a', 'b', 'c'])
    expect(next.notes).toBe(before.notes)
    expect(collectNoteIds(before.root)).toEqual(['a', 'b', 'c'])
    expect(next.root.type).toBe('split')
    if (next.root.type !== 'split' || next.root.first.type !== 'split') throw new Error('Expected nested split')
    expect(next.root.first.direction).toBe(placement === 'above' || placement === 'below' ? 'column' : 'row')
    expect(collectNoteIds(next.root.first)).toEqual(placement === 'left' || placement === 'above' ? ['c', 'a'] : ['a', 'c'])
  })
  it('collapses an emptied parent and merges in target-first order', () => {
    const before = board()
    const next = mergePanes(before, 'b', 'a')!
    expect(collectNoteIds(next.root)).toEqual(['a', 'c'])
    expect(next.notes.a.body).toBe(before.notes.a.body + before.notes.b.body)
    expect(next.notes.b).toBeUndefined()
    expect(before.notes.b).toBeDefined()
    expect(next.focusedNoteId).toBe('a')
  })
  it('rejects missing targets and self operations', () => {
    expect(movePane(board(), 'a', 'a', 'left')).toBeNull()
    expect(movePane(board(), 'a', 'missing', 'right')).toBeNull()
    expect(mergePanes(board(), 'a', 'a')).toBeNull()
    expect(mergePanes(board(), 'missing', 'a')).toBeNull()
  })
})

describe('board transactions and focus', () => {
  it('cuts, undoes and redoes as one complete content/layout change', () => {
    const before = board()
    const e = makeEditor(before.notes.a.body)
    registerEditor('a', e)
    e.commands.setTextSelection({ from: 7, to: 11 })
    useBoardStore.getState().cutContent('a', 'row')
    const cut = useBoardStore.getState()
    const newId = cut.focusedNoteId
    expect(cut.notes.a.body).toBe('<p style="text-align: left;">Alpha </p>')
    expect(cut.notes[newId].body).toBe('<p style="text-align: left;"><strong>bold</strong></p>')
    expect(cut.past).toHaveLength(1)
    cut.undo()
    expect(useBoardStore.getState().notes).toEqual(before.notes)
    expect(useBoardStore.getState().root).toEqual(before.root)
    useBoardStore.getState().redo()
    expect(useBoardStore.getState().notes).toEqual(cut.notes)
    expect(useBoardStore.getState().root).toEqual(cut.root)
  })
  it('restores both notes on merge undo and supports move redo', () => {
    const before = board()
    useBoardStore.getState().mergeNotes('b', 'a')
    expect(Object.keys(useBoardStore.getState().notes)).toHaveLength(2)
    useBoardStore.getState().undo()
    expect(useBoardStore.getState().notes).toEqual(before.notes)
    useBoardStore.getState().moveNote('a', 'c', 'below')
    const moved = useBoardStore.getState().root
    expect(useBoardStore.getState().future).toHaveLength(0)
    useBoardStore.getState().undo()
    expect(useBoardStore.getState().root).toEqual(before.root)
    useBoardStore.getState().redo()
    expect(useBoardStore.getState().root).toEqual(moved)
  })
  it('focus does not mutate layout/history and structural operations exit focus', () => {
    const before = board()
    useBoardStore.getState().toggleFocus('b')
    expect(useBoardStore.getState().focusModeNoteId).toBe('b')
    useBoardStore.getState().exitFocus()
    expect(useBoardStore.getState().root).toEqual(before.root)
    expect(useBoardStore.getState().past).toHaveLength(0)
    useBoardStore.getState().toggleFocus('b')
    useBoardStore.getState().mergeNotes('b', 'a')
    expect(useBoardStore.getState().focusModeNoteId).toBeNull()
  })
  it('invalidates structural redo after typing so a later redo cannot erase new text', () => {
    useBoardStore.getState().mergeNotes('b', 'a')
    useBoardStore.getState().undo()
    useBoardStore.getState().updateNoteBody('a', '<p>New thought</p>')
    expect(useBoardStore.getState().future).toHaveLength(0)
    useBoardStore.getState().redo()
    expect(useBoardStore.getState().notes.a.body).toBe('<p>New thought</p>')
  })
  it('persists content and layout after a merge', async () => {
    useBoardStore.getState().mergeNotes('b', 'a')
    const state = useBoardStore.getState()
    await vi.advanceTimersByTimeAsync(350)
    const saved = JSON.parse(localStorage.getItem('cut-note:board')!)
    expect(saved.root).toEqual(state.root)
    expect(saved.notes).toEqual(state.notes)
    expect(saved.focusModeNoteId).toBeUndefined()
  })
})
