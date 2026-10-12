import type { NoteStyle } from '../board/types'

export type TemplatePane =
  /** `body`/`style` are only present in templates saved with notes. */
  | { type: 'leaf'; body?: string; style?: NoteStyle }
  | {
      type: 'split'
      direction: 'row' | 'column'
      ratio: number
      first: TemplatePane
      second: TemplatePane
    }

/** Saved board layout; optionally also carries each pane's note content. */
export type BoardTemplate = {
  id: string
  name: string
  createdAt: number
  paneCount: number
  withNotes: boolean
  layout: TemplatePane
}
