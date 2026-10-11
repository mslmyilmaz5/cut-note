import type { Editor } from '@tiptap/react'
import { DEFAULT_NOTE_STYLE, type NoteStyle } from '../board/types'
import type { StyleAction } from '../notes/store'
import { cycleEditorStyle, readActiveStyle } from './styleCommands'

type Listener = () => void

const editors = new Map<string, Editor>()
let activeNoteId: string | null = null
let dockGuard = 0
const listeners = new Set<Listener>()

function emit() {
  listeners.forEach((listener) => listener())
}

export function registerEditor(noteId: string, editor: Editor): void {
  editors.set(noteId, editor)
}

export function unregisterEditor(noteId: string, editor?: Editor): void {
  const current = editors.get(noteId)
  if (!current) return
  if (editor && current !== editor) return
  editors.delete(noteId)
  if (activeNoteId === noteId) {
    activeNoteId = null
    emit()
  }
}

export function setActiveEditor(noteId: string, editor: Editor): void {
  editors.set(noteId, editor)
  activeNoteId = noteId
  emit()
}

/** Keep the active editor across style-dock pointer interactions. */
export function beginStyleDockInteraction(): void {
  dockGuard += 1
}

export function endStyleDockInteraction(): void {
  window.setTimeout(() => {
    dockGuard = Math.max(0, dockGuard - 1)
  }, 0)
}

export function isStyleDockInteraction(): boolean {
  return dockGuard > 0
}

export function clearActiveEditor(noteId?: string): void {
  if (isStyleDockInteraction()) return
  if (noteId && activeNoteId !== noteId) return
  activeNoteId = null
  emit()
}

export function getActiveEditor(): Editor | null {
  if (activeNoteId) {
    return editors.get(activeNoteId) ?? null
  }
  return null
}

export function getEditorForNote(noteId: string | null | undefined): Editor | null {
  if (!noteId) return null
  return editors.get(noteId) ?? null
}

export function resolveStyleEditor(focusedNoteId?: string | null): Editor | null {
  return (
    getActiveEditor() ??
    getEditorForNote(focusedNoteId) ??
    null
  )
}

export function subscribeActiveEditor(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getActiveEditorStyle(focusedNoteId?: string | null): NoteStyle {
  const editor = resolveStyleEditor(focusedNoteId)
  if (!editor) return DEFAULT_NOTE_STYLE
  return readActiveStyle(editor)
}

export function cycleActiveEditorStyle(
  action: StyleAction,
  focusedNoteId?: string | null,
): boolean {
  const editor = resolveStyleEditor(focusedNoteId)
  if (!editor) return false
  cycleEditorStyle(editor, action)
  emit()
  return true
}

export function notifyEditorSelectionChanged() {
  emit()
}
