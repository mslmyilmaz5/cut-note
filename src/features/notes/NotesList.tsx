import { AnimatePresence, motion } from 'motion/react'
import { noteTitle } from '../board/splitTree'
import { useBoardStore } from './store'

function formatTime(ts: number): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(ts)
}

export function NotesList() {
  const open = useBoardStore((s) => s.notesOpen)
  const notes = useBoardStore((s) => s.notes)
  const focusedNoteId = useBoardStore((s) => s.focusedNoteId)
  const setFocusedNoteId = useBoardStore((s) => s.setFocusedNoteId)
  const setNotesOpen = useBoardStore((s) => s.setNotesOpen)
  const deleteNote = useBoardStore((s) => s.deleteNote)

  const items = Object.values(notes).sort((a, b) => b.updatedAt - a.updatedAt)

  return (
    <AnimatePresence>
      {open ? (
        <motion.aside
          className="notes-panel"
          initial={{ x: '100%', opacity: 0.6 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0.6 }}
          transition={{ type: 'spring', stiffness: 380, damping: 36 }}
        >
          <header className="notes-panel__header">
            <h2>Notes</h2>
            <button
              type="button"
              className="icon-btn"
              aria-label="Close notes"
              onClick={() => setNotesOpen(false)}
            >
              ✕
            </button>
          </header>
          <ul className="notes-panel__list">
            {items.map((note) => (
              <li key={note.id}>
                <button
                  type="button"
                  className={`notes-item${focusedNoteId === note.id ? ' notes-item--active' : ''}`}
                  onClick={() => {
                    setFocusedNoteId(note.id)
                    setNotesOpen(false)
                  }}
                >
                  <span className="notes-item__title">{noteTitle(note.body)}</span>
                  <span className="notes-item__meta">{formatTime(note.updatedAt)}</span>
                </button>
                {items.length > 1 ? (
                  <button
                    type="button"
                    className="notes-item__delete"
                    aria-label={`Delete ${noteTitle(note.body)}`}
                    onClick={() => deleteNote(note.id)}
                  >
                    Delete
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  )
}
