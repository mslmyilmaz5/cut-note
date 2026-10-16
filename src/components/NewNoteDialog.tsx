import { useEffect, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { useBoardStore } from '../features/notes/store'

export function NewNoteDialog({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [name, setName] = useState('Untitled')
  const [busy, setBusy] = useState(false)
  const theme = useBoardStore((s) => s.theme)
  const error = useBoardStore((s) => s.documentError)
  const newDocument = useBoardStore((s) => s.newCutNoteDocument)

  useEffect(() => {
    const element = dialog.current
    element?.showModal()
    return () => element?.close()
  }, [])

  const proceed = async (save: boolean) => {
    if (busy) return
    setBusy(true)
    try {
      const opened = await newDocument(save ? name : undefined)
      if (opened) onClose()
    } finally {
      setBusy(false)
    }
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    void proceed(true)
  }

  return createPortal(
    <dialog
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-note-title"
      aria-describedby="new-note-description"
      aria-busy={busy}
      className={`pane-dialog new-note-dialog app--theme-${theme}`}
      onCancel={(event) => {
        event.preventDefault()
        if (!busy) onClose()
      }}
    >
      <form onSubmit={submit}>
        <h2 id="new-note-title">Save before creating a new note?</h2>
        <p id="new-note-description">
          Save the current board and all its notes as a .cutnote file before opening a blank board.
        </p>
        <label htmlFor="new-note-save-name">File name</label>
        <input
          id="new-note-save-name"
          className="titlebar-save-popover__input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={60}
          autoComplete="off"
          disabled={busy}
          required
        />
        {error && <p role="alert" className="titlebar-save-popover__error">{error}</p>}
        <div className="pane-dialog__buttons new-note-dialog__buttons">
          <button type="button" disabled={busy} onClick={onClose}>Cancel</button>
          <button type="button" disabled={busy} onClick={() => void proceed(false)}>Don't Save</button>
          <button type="submit" disabled={busy || !name.trim()}>
            {busy ? 'Please wait…' : 'Save & New Note'}
          </button>
        </div>
      </form>
    </dialog>,
    document.body,
  )
}
