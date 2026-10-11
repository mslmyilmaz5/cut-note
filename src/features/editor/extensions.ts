import { Extension } from '@tiptap/core'
import { Color } from '@tiptap/extension-color'
import FontFamily from '@tiptap/extension-font-family'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import StarterKit from '@tiptap/starter-kit'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (fontSize: string) => ReturnType
      unsetFontSize: () => ReturnType
    }
    fontWeight: {
      setFontWeight: (fontWeight: string) => ReturnType
      unsetFontWeight: () => ReturnType
    }
  }
}

const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return { types: ['textStyle'] }
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize || null,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) return {}
              return { style: `font-size: ${attributes.fontSize}` }
            },
          },
        },
      },
    ]
  },
  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ commands }) =>
          commands.setMark('textStyle', { fontSize }),
      unsetFontSize:
        () =>
        ({ chain }) =>
          chain()
            .setMark('textStyle', { fontSize: null })
            .removeEmptyTextStyle()
            .run(),
    }
  },
})

const FontWeight = Extension.create({
  name: 'fontWeight',
  addOptions() {
    return { types: ['textStyle'] }
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontWeight: {
            default: null,
            parseHTML: (element) => element.style.fontWeight || null,
            renderHTML: (attributes) => {
              if (!attributes.fontWeight) return {}
              return { style: `font-weight: ${attributes.fontWeight}` }
            },
          },
        },
      },
    ]
  },
  addCommands() {
    return {
      setFontWeight:
        (fontWeight: string) =>
        ({ commands }) =>
          commands.setMark('textStyle', { fontWeight }),
      unsetFontWeight:
        () =>
        ({ chain }) =>
          chain()
            .setMark('textStyle', { fontWeight: null })
            .removeEmptyTextStyle()
            .run(),
    }
  },
})

export function createEditorExtensions(placeholder: string) {
  return [
    StarterKit.configure({
      heading: false,
      codeBlock: false,
      blockquote: false,
      horizontalRule: false,
      code: false,
    }),
    TextStyle,
    FontFamily,
    FontSize,
    FontWeight,
    Color,
    TextAlign.configure({
      types: ['paragraph', 'heading'],
      alignments: ['left', 'center', 'right'],
      defaultAlignment: 'left',
    }),
    Placeholder.configure({
      placeholder,
    }),
  ]
}
