export type TemplatePane =
  | { type: 'leaf' }
  | {
      type: 'split'
      direction: 'row' | 'column'
      ratio: number
      first: TemplatePane
      second: TemplatePane
    }

/** Layout-only template (empty notes when applied). */
export type BoardTemplate = {
  id: string
  name: string
  createdAt: number
  paneCount: number
  layout: TemplatePane
}
