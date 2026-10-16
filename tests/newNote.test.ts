// @vitest-environment jsdom
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { useBoardStore } from '../src/features/notes/store'
import { saveCutNoteFile } from '../src/lib/documentFile'
import { DEFAULT_NOTE_STYLE } from '../src/features/board/types'

vi.mock('../src/lib/documentFile', () => ({ saveCutNoteFile: vi.fn(), openCutNoteFile: vi.fn() }))

beforeEach(() => {
  vi.useFakeTimers()
  vi.mocked(saveCutNoteFile).mockReset()
  useBoardStore.setState({
    root: { type: 'leaf', noteId: 'old' },
    notes: { old: { id: 'old', body: '<p>Keep this note</p>', style: DEFAULT_NOTE_STYLE, createdAt: 1, updatedAt: 1 } },
    focusedNoteId: 'old', theme: 'white', documentError: null,
    focusModeNoteId: 'old', notesOpen: true, past: [], future: [],
  })
})
afterEach(async () => {
  await vi.runOnlyPendingTimersAsync()
  vi.useRealTimers()
})

it('saves the old board before opening one blank note', async () => {
  vi.mocked(saveCutNoteFile).mockResolvedValue('/notes/meeting.cutnote')
  expect(await useBoardStore.getState().newCutNoteDocument('Meeting')).toBe(true)
  expect(saveCutNoteFile).toHaveBeenCalledWith(expect.objectContaining({
    name: 'Meeting', notes: expect.objectContaining({ old: expect.objectContaining({ body: '<p>Keep this note</p>' }) }),
  }))
  const state = useBoardStore.getState()
  expect(Object.values(state.notes)).toHaveLength(1)
  expect(state.notes[state.focusedNoteId].body).toBe('')
  expect(state.notes.old).toBeUndefined()
  expect(state.theme).toBe('white')
  expect(state.focusModeNoteId).toBeNull()
  expect(state.notesOpen).toBe(false)
  expect(state.past).toEqual([])
  await vi.advanceTimersByTimeAsync(350)
  expect(JSON.parse(localStorage.getItem('cut-note:board')!).root).toEqual(state.root)
})

it('keeps the current board when the save picker is cancelled', async () => {
  const before = useBoardStore.getState()
  vi.mocked(saveCutNoteFile).mockResolvedValue(null)
  expect(await before.newCutNoteDocument('Meeting')).toBe(false)
  expect(useBoardStore.getState().notes).toBe(before.notes)
  expect(useBoardStore.getState().root).toBe(before.root)
})

it('keeps the current board and shows an error when saving fails', async () => {
  const before = useBoardStore.getState()
  vi.mocked(saveCutNoteFile).mockRejectedValue(new Error('Disk full'))
  expect(await before.newCutNoteDocument('Meeting')).toBe(false)
  expect(useBoardStore.getState().notes).toBe(before.notes)
  expect(useBoardStore.getState().documentError).toBe('Disk full')
})

it('waits for the save to finish before replacing the board', async () => {
  let finish!: (path: string) => void
  vi.mocked(saveCutNoteFile).mockImplementation(() => new Promise((resolve) => { finish = resolve }))
  const pending = useBoardStore.getState().newCutNoteDocument('Meeting')
  expect(useBoardStore.getState().notes.old.body).toBe('<p>Keep this note</p>')
  finish('/notes/meeting.cutnote')
  await pending
  expect(useBoardStore.getState().notes.old).toBeUndefined()
})

it('opens a blank board without exporting when Don’t Save is chosen', async () => {
  expect(await useBoardStore.getState().newCutNoteDocument()).toBe(true)
  expect(saveCutNoteFile).not.toHaveBeenCalled()
  expect(useBoardStore.getState().notes.old).toBeUndefined()
})
