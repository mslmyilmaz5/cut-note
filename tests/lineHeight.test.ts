// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest'
import { Editor } from '@tiptap/react'
import { createEditorExtensions } from '../src/features/editor/extensions'
import { readLineHeight } from '../src/features/editor/lineHeight'
import { extractEditorContent } from '../src/features/editor/contentCut'

let editor: Editor
function setup(content = '<p>First</p><p>Second</p>') {
  editor = new Editor({ extensions: createEditorExtensions(''), content })
  return editor
}
afterEach(() => editor?.destroy())

it('adjusts only the current paragraph without changing text selection', () => {
  const e = setup()
  e.commands.setTextSelection(3)
  expect(readLineHeight(e)).toBe('1.65')
  e.commands.setLineHeight('2')
  expect(readLineHeight(e)).toBe('2')
  expect(e.state.selection.from).toBe(3)
  expect(e.state.selection.empty).toBe(true)
  expect(e.state.doc.child(0).attrs.lineHeight).toBe('2')
  expect(e.state.doc.child(1).attrs.lineHeight).toBeNull()
  e.commands.undo()
  expect(readLineHeight(e)).toBe('1.65')
  e.commands.redo()
  expect(readLineHeight(e)).toBe('2')
})

it('shows mixed values and updates every selected paragraph including list items', () => {
  const e = setup('<p style="line-height: 2">First</p><ul><li><p>Second</p></li></ul>')
  e.commands.selectAll()
  expect(readLineHeight(e)).toBe('')
  e.commands.setLineHeight('1.5')
  expect(readLineHeight(e)).toBe('1.5')
  const values: string[] = []
  e.state.doc.descendants((node) => { if (node.type.name === 'paragraph') values.push(node.attrs.lineHeight) })
  expect(values.length).toBeGreaterThanOrEqual(2)
  expect(values.every((value) => value === '1.5')).toBe(true)
})

it('preserves line height through HTML save/load and cutting', () => {
  const e = setup('<p style="line-height: 2.5"><strong>First</strong></p>')
  e.commands.setTextSelection({ from: 1, to: 6 })
  const cut = extractEditorContent(e)!
  expect(cut.extracted).toContain('line-height: 2.5')
  e.commands.setContent(cut.extracted)
  e.commands.setTextSelection(2)
  expect(readLineHeight(e)).toBe('2.5')
  expect(e.getHTML()).toContain('<strong>First</strong>')
})

it('rejects invalid values and supports returning to inherited spacing', () => {
  const e = setup()
  expect(e.commands.setLineHeight('NaN')).toBe(false)
  expect(e.commands.setLineHeight('0')).toBe(false)
  expect(e.commands.setLineHeight('100')).toBe(false)
  expect(e.commands.setLineHeight('2px')).toBe(false)
  e.commands.setLineHeight('3')
  e.commands.unsetLineHeight()
  expect(readLineHeight(e)).toBe('1.65')
  expect(e.getHTML()).not.toContain('line-height')
})
