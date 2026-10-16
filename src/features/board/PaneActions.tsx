import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { getEditorForNote } from '../editor/editorBridge'
import { extractEditorContent } from '../editor/contentCut'
import { useBoardStore } from '../notes/store'
import { collectNoteIds, noteTitle } from './splitTree'
import type { PanePlacement } from './operations'

export function PaneActions({ noteId }: { noteId: string }) {
  const controlId = useId()
  const [open, setOpen] = useState(false)
  const [targetId, setTargetId] = useState('')
  const [placement, setPlacement] = useState<PanePlacement>('right')
  const trigger = useRef<HTMLButtonElement>(null)
  const dialog = useRef<HTMLDivElement>(null)
  const notes = useBoardStore((s) => s.notes)
  const root = useBoardStore((s) => s.root)
  const focusModeNoteId = useBoardStore((s) => s.focusModeNoteId)
  const toggleFocus = useBoardStore((s) => s.toggleFocus)
  const targets = collectNoteIds(root).filter((id) => id !== noteId)
  const target = targets.includes(targetId) ? targetId : targets[0] ?? ''
  const editor = open ? getEditorForNote(noteId) : null
  const canCut = editor ? Boolean(extractEditorContent(editor)) : false
  const hasSelection = editor ? !editor.state.selection.empty : false

  useEffect(() => {
    if (!open) return
    dialog.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopImmediatePropagation()
        setOpen(false)
        trigger.current?.focus()
      }
      if (event.key === 'Tab') {
        const items = Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), select:not(:disabled)') ?? [])
        const current = items.indexOf(document.activeElement as HTMLElement)
        const next = event.shiftKey ? (current <= 0 ? items.length - 1 : current - 1) : (current + 1) % items.length
        event.preventDefault()
        items[next]?.focus()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open])

  const act = (operation: () => void) => {
    setOpen(false)
    operation()
  }

  return (
    <>
      <div className="pane-actions" onPointerDown={(event) => event.stopPropagation()}>
        <button type="button" title={focusModeNoteId === noteId ? 'Back to board (Esc)' : 'Focus note (⌘⇧F)'} aria-label={focusModeNoteId === noteId ? 'Back to board' : 'Focus note'} aria-pressed={focusModeNoteId === noteId} onClick={() => toggleFocus(noteId)}>
          {focusModeNoteId === noteId ? '↙' : '↗'}
        </button>
        <button ref={trigger} type="button" aria-label="Note actions" aria-haspopup="dialog" aria-expanded={open} title="Cut content, move or merge" onPointerDown={(event) => event.preventDefault()} onClick={() => setOpen(true)}>•••</button>
      </div>
      {open && createPortal(
        <div className={`pane-dialog-backdrop app--theme-${useBoardStore.getState().theme}`} onPointerDown={(event) => {
          if (event.target === event.currentTarget) { setOpen(false); trigger.current?.focus() }
        }}>
          <div className="pane-dialog" role="dialog" aria-modal="true" aria-label="Note actions" tabIndex={-1} ref={dialog}>
            <header><h2>Note actions</h2><button type="button" aria-label="Close note actions" onClick={() => { setOpen(false); trigger.current?.focus() }}>✕</button></header>
            <p className="pane-dialog__title">{noteTitle(notes[noteId]?.body ?? '')}</p>
            <section>
              <h3>Cut content into a new note</h3>
              <p>{hasSelection ? 'Move the selected text, keeping its formatting.' : 'Move everything after the cursor. Select text first to cut a specific passage.'}</p>
              <div className="pane-dialog__buttons">
                <button type="button" disabled={!canCut} onClick={() => act(() => useBoardStore.getState().cutContent(noteId, 'row'))}>Cut to right</button>
                <button type="button" disabled={!canCut} onClick={() => act(() => useBoardStore.getState().cutContent(noteId, 'column'))}>Cut below</button>
              </div>
              {!canCut && <p>No text to cut. Place the cursor before some text or select a passage.</p>}
            </section>
            <section>
              <h3>Move or merge</h3>
              {targets.length ? <>
                <label htmlFor={`${controlId}-target`}>Target note</label><select id={`${controlId}-target`} value={target} onChange={(event) => setTargetId(event.target.value)}>{targets.map((id, index) => <option key={id} value={id}>{index + 1}. {noteTitle(notes[id].body).slice(0, 70)}</option>)}</select>
                <label htmlFor={`${controlId}-placement`}>Move to</label><select id={`${controlId}-placement`} value={placement} onChange={(event) => setPlacement(event.target.value as PanePlacement)}><option value="left">Left of target</option><option value="right">Right of target</option><option value="above">Above target</option><option value="below">Below target</option></select>
                <div className="pane-dialog__buttons">
                  <button type="button" onClick={() => act(() => useBoardStore.getState().moveNote(noteId, target, placement))}>Move note</button>
                  <button type="button" onClick={() => act(() => useBoardStore.getState().mergeNotes(noteId, target))}>Merge into target</button>
                </div>
                <p>Merge appends this note after the target’s content. Both actions can be undone with Undo board.</p>
              </> : <p>Cut the board or some content to create another note first.</p>}
            </section>
          </div>
        </div>, document.body,
      )}
    </>
  )
}
