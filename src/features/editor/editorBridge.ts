import type { Editor } from '@tiptap/react'
import { DEFAULT_NOTE_STYLE, type NoteColor, type NoteStyle } from '../board/types'
import type { StyleAction } from '../notes/store'
import {
  cycleEditorStyle,
  readActiveStyle,
  readActiveTextColor,
  setEditorColor,
  setEditorCustomColor,
} from './styleCommands'

type Listener = () => void

const editors = new Map<string, Editor>()
let activeNoteId: string | null = null
let dockGuard = 0
const listeners = new Set<Listener>()

function emit() {
  listeners.forEach((listener) => listener())
}

/**
 * StrictMode can create a throwaway editor that never mounts; its callbacks may
 * still fire, so only editors attached to the page count.
 */
function isLive(editor: Editor | undefined): editor is Editor {
  if (!editor || editor.isDestroyed) return false
  try {
    return editor.view.dom.isConnected
  } catch {
    // Tiptap throws when the view isn't mounted.
    return false
  }
}

function storeEditor(noteId: string, editor: Editor): void {
  // Never let an unmounted instance replace the live one.
  if (!isLive(editor) && isLive(editors.get(noteId))) return
  editors.set(noteId, editor)
}

export function registerEditor(noteId: string, editor: Editor): void {
  storeEditor(noteId, editor)
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
  storeEditor(noteId, editor)
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
  if (!activeNoteId) return null
  const editor = editors.get(activeNoteId)
  return isLive(editor) ? editor : null
}

export function getEditorForNote(noteId: string | null | undefined): Editor | null {
  if (!noteId) return null
  const editor = editors.get(noteId)
  return isLive(editor) ? editor : null
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

export function setActiveEditorColor(
  color: NoteColor,
  focusedNoteId?: string | null,
): boolean {
  const editor = resolveStyleEditor(focusedNoteId)
  if (!editor) return false
  setEditorColor(editor, color)
  emit()
  return true
}

export function setActiveEditorCustomColor(
  css: string,
  focusedNoteId?: string | null,
): boolean {
  const editor = resolveStyleEditor(focusedNoteId)
  if (!editor) return false
  setEditorCustomColor(editor, css)
  emit()
  return true
}

export function getActiveEditorTextColor(
  focusedNoteId?: string | null,
): string | undefined {
  const editor = resolveStyleEditor(focusedNoteId)
  return editor ? readActiveTextColor(editor) : undefined
}

export function notifyEditorSelectionChanged() {
  emit()
}
