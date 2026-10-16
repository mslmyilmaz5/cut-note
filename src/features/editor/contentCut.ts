import type { Editor } from '@tiptap/react'
import { DOMSerializer } from '@tiptap/pm/model'

/** Build both documents without mutating the editor: the board owns this undo step. */
export function extractEditorContent(editor: Editor): { remaining: string; extracted: string } | null {
  const { doc, selection, schema } = editor.state
  const from = selection.from
  const to = selection.empty ? doc.content.size : selection.to
  if (from >= to || !doc.textBetween(from, to, '\n').trim()) return null

  const serialize = (content: typeof doc.content) => {
    const container = document.createElement('div')
    container.appendChild(DOMSerializer.fromSchema(schema).serializeFragment(content))
    return container.innerHTML
  }

  return {
    remaining: serialize(editor.state.tr.delete(from, to).doc.content),
    // Cutting the document retains enclosing paragraphs/lists and their text styles.
    extracted: serialize(doc.cut(from, to).content),
  }
}

export function toNoteHtml(body: string): string {
  if (/<[a-z][\s\S]*>/i.test(body.trim())) return body
  return `<p>${body.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('\n', '<br>')}</p>`
}
