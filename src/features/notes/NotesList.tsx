import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { collectNoteIds, noteTitle } from '../board/splitTree'
import { useBoardStore } from './store'

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.1c.05.8.7 1.4 1.5 1.4h2.8c.8 0 1.45-.6 1.5-1.4l.6-8.1"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

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
  const undo = useBoardStore((s) => s.undo)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  // ⌘Z goes to the editor once it refocuses, so offer undo right here.
  const [deleted, setDeleted] = useState<{ title: string; at: number } | null>(null)

  useEffect(() => {
    if (!deleted) return
    const timer = window.setTimeout(() => setDeleted(null), 6000)
    return () => window.clearTimeout(timer)
  }, [deleted])

  const root = useBoardStore((s) => s.root)
  const items = collectNoteIds(root)
    .map((id) => notes[id])
    .filter((note): note is NonNullable<typeof note> => Boolean(note))
    .sort((a, b) => b.updatedAt - a.updatedAt)

  return (
    <AnimatePresence
      onExitComplete={() => {
        setConfirmId(null)
        setDeleted(null)
      }}
    >
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
            {items.map((note) => {
              const title = noteTitle(note.body)
              const confirming = confirmId === note.id
              return (
                <li
                  key={note.id}
                  className={`notes-row${confirming ? ' notes-row--confirm' : ''}`}
                >
                  <button
                    type="button"
                    className={`notes-item${focusedNoteId === note.id ? ' notes-item--active' : ''}`}
                    title={title}
                    onClick={() => {
                      setFocusedNoteId(note.id)
                      setNotesOpen(false)
                    }}
                  >
                    <span className="notes-item__title">{title}</span>
                    <span className="notes-item__meta">{formatTime(note.updatedAt)}</span>
                  </button>
                  {items.length > 1 ? (
                    confirming ? (
                      <span className="notes-row__confirm">
                        <button
                          type="button"
                          className="notes-row__btn notes-row__btn--danger"
                          autoFocus
                          onClick={() => {
                            setConfirmId(null)
                            deleteNote(note.id)
                            setDeleted({ title, at: Date.now() })
                          }}
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          className="notes-row__btn"
                          onClick={() => setConfirmId(null)}
                        >
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="notes-row__trash"
                        aria-label={`Delete ${title}`}
                        title="Delete note"
                        onClick={() => setConfirmId(note.id)}
                      >
                        <TrashIcon />
                      </button>
                    )
                  ) : null}
                </li>
              )
            })}
          </ul>
          <AnimatePresence>
            {deleted ? (
              <motion.div
                key={deleted.at}
                className="notes-panel__undo"
                role="status"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.16 }}
              >
                <span className="notes-panel__undo-text">
                  Deleted “{deleted.title}”
                </span>
                <button
                  type="button"
                  className="notes-row__btn"
                  onClick={() => {
                    undo()
                    setDeleted(null)
                  }}
                >
                  Undo
                </button>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  )
}
