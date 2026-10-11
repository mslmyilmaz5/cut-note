import type { Editor } from '@tiptap/react'
import { TextSelection } from '@tiptap/pm/state'

const WORD_CHAR = /[\p{L}\p{N}_]/u

/** If caret is collapsed, expand selection to the word under the caret (Word-like). */
export function ensureWordSelection(editor: Editor): void {
  const { state, view } = editor
  const { from, empty } = state.selection
  if (!empty) return

  const $pos = state.doc.resolve(from)
  if (!$pos.parent.isTextblock) return

  const text = $pos.parent.textContent
  const offset = $pos.parentOffset
  if (!text) return

  let start = offset
  let end = offset

  while (start > 0 && WORD_CHAR.test(text[start - 1] ?? '')) start -= 1
  while (end < text.length && WORD_CHAR.test(text[end] ?? '')) end += 1

  if (start === end) {
    // No word under caret — leave collapsed so typing marks still apply.
    return
  }

  const parentStart = from - offset
  const selection = TextSelection.create(
    state.doc,
    parentStart + start,
    parentStart + end,
  )
  view.dispatch(state.tr.setSelection(selection))
}
