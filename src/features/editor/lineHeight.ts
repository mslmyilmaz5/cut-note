import { Extension } from '@tiptap/core'
import type { Editor } from '@tiptap/react'

export const DEFAULT_LINE_HEIGHT = '1.65'
export const LINE_HEIGHT_OPTIONS = ['1', '1.2', '1.5', '1.65', '1.8', '2', '2.5', '3']

function validLineHeight(value: string): boolean {
  return /^\d+(\.\d+)?$/.test(value) && Number(value) >= 1 && Number(value) <= 3
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    lineHeight: {
      setLineHeight: (value: string) => ReturnType
      unsetLineHeight: () => ReturnType
    }
  }
}

export const LineHeight = Extension.create({
  name: 'lineHeight',
  addGlobalAttributes() {
    return [{
      types: ['paragraph'],
      attributes: {
        lineHeight: {
          default: null,
          parseHTML: (element) => validLineHeight(element.style.lineHeight) ? element.style.lineHeight : null,
          renderHTML: ({ lineHeight }) => lineHeight && validLineHeight(String(lineHeight))
            ? { style: `line-height: ${lineHeight}` }
            : {},
        },
      },
    }]
  },
  addCommands() {
    return {
      setLineHeight: (value) => ({ commands }) =>
        validLineHeight(value) && commands.updateAttributes('paragraph', { lineHeight: value }),
      unsetLineHeight: () => ({ commands }) => commands.resetAttributes('paragraph', 'lineHeight'),
    }
  },
})

/** Paragraph spacing applies to the caret's block or all selected paragraphs. */
export function readLineHeight(editor: Editor): string {
  const values = new Set<string>()
  const { from, to } = editor.state.selection
  editor.state.doc.nodesBetween(from, to, (node) => {
    if (node.type.name === 'paragraph') values.add(node.attrs.lineHeight ?? DEFAULT_LINE_HEIGHT)
  })
  return values.size > 1 ? '' : values.values().next().value ?? DEFAULT_LINE_HEIGHT
}
