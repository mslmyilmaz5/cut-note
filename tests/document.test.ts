import { describe, expect, it } from 'vitest'
import {
  normalizeStoredBoard,
  parseCutNote,
  serializeCutNote,
  suggestedFileName,
  type CutNoteDocument,
} from '../src/features/document/cutnote'
import { DEFAULT_NOTE_STYLE } from '../src/features/board/types'
import { useBoardStore } from '../src/features/notes/store'

function doc(overrides: Partial<CutNoteDocument> = {}): CutNoteDocument {
  return {
    format: 'cutnote',
    version: 1,
    name: 'Toplantı',
    createdAt: 1,
    theme: 'black',
    root: { type: 'leaf', noteId: 'a' },
    notes: {
      a: {
        id: 'a',
        body: '<p>Merhaba</p>',
        createdAt: 1,
        updatedAt: 1,
        style: { ...DEFAULT_NOTE_STYLE },
      },
    },
    focusedNoteId: 'a',
    ...overrides,
  }
}

describe('cutnote documents', () => {
  it('keeps letters from the file name, including Turkish', () => {
    expect(suggestedFileName('Toplantı notu')).toBe('Toplantı-notu.cutnote')
    expect(suggestedFileName('***')).toBe('Untitled.cutnote')
  })

  it('rejects a layout that points at a missing note', () => {
    const raw = serializeCutNote(doc())
    const broken = raw.replace('"a"', '"missing"')
    expect(() => parseCutNote(broken)).toThrow(/layout/i)
  })

  it('rejects a split ratio that is not a real fraction', () => {
    const raw = JSON.parse(serializeCutNote(doc())) as CutNoteDocument
    raw.root = {
      type: 'split',
      id: 's',
      direction: 'row',
      ratio: Number.NaN,
      first: { type: 'leaf', noteId: 'a' },
      second: { type: 'leaf', noteId: 'a' },
    }
    expect(() => parseCutNote(JSON.stringify(raw))).toThrow(/layout/i)
  })

  it('opens a raw document onto the current board', () => {
    const opened = useBoardStore.getState().openCutNoteRaw(serializeCutNote(doc()))
    expect(opened).toBe(true)
    expect(useBoardStore.getState().notes.a.body).toContain('Merhaba')
  })

  it('repairs a note whose body is missing and drops a corrupt autosave', () => {
    const saved = doc()
    saved.notes.a = { ...saved.notes.a, body: undefined as unknown as string }
    const board = normalizeStoredBoard(saved)
    expect(board?.notes.a.body).toBe('')

    expect(normalizeStoredBoard({ root: { type: 'nope' }, notes: {}, focusedNoteId: 'a' })).toBeNull()
  })
})
