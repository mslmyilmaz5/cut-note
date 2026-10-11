import { EditorContent, useEditor } from '@tiptap/react'
import { useEffect } from 'react'
import {
  clearActiveEditor,
  isStyleDockInteraction,
  notifyEditorSelectionChanged,
  registerEditor,
  setActiveEditor,
  unregisterEditor,
} from './editorBridge'
import { createEditorExtensions } from './extensions'

type Props = {
  noteId: string
  body: string
  editable: boolean
  placeholder: string
  autofocus: boolean
  onFocusNote: (id: string) => void
  onChangeBody: (id: string, html: string) => void
}

function toEditorHtml(body: string): string {
  const trimmed = body.trim()
  if (!trimmed) return '<p></p>'
  if (/<[a-z][\s\S]*>/i.test(trimmed)) return body
  return `<p>${escapeHtml(body).replace(/\n/g, '<br>')}</p>`
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

export function RichEditor({
  noteId,
  body,
  editable,
  placeholder,
  autofocus,
  onFocusNote,
  onChangeBody,
}: Props) {
  const editor = useEditor(
    {
      extensions: createEditorExtensions(placeholder),
      content: toEditorHtml(body),
      editable,
      autofocus: autofocus ? 'end' : false,
      editorProps: {
        attributes: {
          class: 'pane-editor pane-editor--rich',
        },
        handleDOMEvents: {
          focus: () => {
            onFocusNote(noteId)
            return false
          },
        },
      },
      onCreate: ({ editor: current }) => {
        registerEditor(noteId, current)
      },
      onSelectionUpdate: () => {
        notifyEditorSelectionChanged()
      },
      onTransaction: () => {
        notifyEditorSelectionChanged()
      },
      onUpdate: ({ editor: current }) => {
        onChangeBody(noteId, current.getHTML())
        notifyEditorSelectionChanged()
      },
      onFocus: ({ editor: current }) => {
        setActiveEditor(noteId, current)
        onFocusNote(noteId)
      },
      onBlur: ({ editor: current }) => {
        window.setTimeout(() => {
          if (isStyleDockInteraction()) return
          if (current.isFocused) return
          const active = document.activeElement
          if (active?.closest('.style-dock')) return
          clearActiveEditor(noteId)
        }, 0)
      },
    },
    [noteId],
  )

  useEffect(() => {
    if (!editor) return
    registerEditor(noteId, editor)
    return () => {
      unregisterEditor(noteId, editor)
    }
  }, [editor, noteId])

  useEffect(() => {
    if (!editor) return
    editor.setEditable(editable)
  }, [editor, editable])

  useEffect(() => {
    if (!editor) return
    const next = toEditorHtml(body)
    if (editor.getHTML() === next) return
    // Avoid clobbering local marks while the user is editing this note.
    if (editor.isFocused) return
    editor.commands.setContent(next, { emitUpdate: false })
  }, [editor, body, noteId])

  useEffect(() => {
    if (!editor || !autofocus) return
    setActiveEditor(noteId, editor)
    editor.commands.focus('end')
  }, [autofocus, editor, noteId])

  if (!editor) return null

  return (
    <div className="pane-editor-host">
      <EditorContent editor={editor} />
    </div>
  )
}
