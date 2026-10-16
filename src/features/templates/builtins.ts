import { countTemplatePanes, templateHasNotes } from './layout'
import type { BoardTemplate, TemplatePane } from './types'

const BUILTIN_CREATED_AT = Date.UTC(2026, 0, 1)

function leaf(body: string): TemplatePane {
  return {
    type: 'leaf',
    body,
    style: {
      font: 'sans',
      size: 'md',
      weight: 'regular',
      align: 'left',
      list: 'none',
      color: 'default',
    },
  }
}

function split(
  direction: 'row' | 'column',
  ratio: number,
  first: TemplatePane,
  second: TemplatePane,
): TemplatePane {
  return { type: 'split', direction, ratio, first, second }
}

function builtin(
  id: string,
  name: string,
  layout: TemplatePane,
): BoardTemplate {
  return {
    id,
    name,
    createdAt: BUILTIN_CREATED_AT,
    paneCount: countTemplatePanes(layout),
    withNotes: templateHasNotes(layout),
    layout,
  }
}

/**
 * SWOT — classic 2×2:
 *
 *   ┌──────────┬──────────┐
 *   │    S     │    W     │
 *   ├──────────┼──────────┤
 *   │    O     │    T     │
 *   └──────────┴──────────┘
 */
const SWOT_LAYOUT = split(
  'column',
  0.5,
  split(
    'row',
    0.5,
    leaf(
      `<p><strong>Strengths</strong></p><p></p><p>Internal advantages</p><p></p><p>• What are we uniquely good at?</p><p>• Which assets or capabilities stand out?</p><p>• What do customers praise?</p>`,
    ),
    leaf(
      `<p><strong>Weaknesses</strong></p><p></p><p>Internal gaps</p><p></p><p>• Where do we underperform?</p><p>• What resources are missing?</p><p>• What feedback keeps repeating?</p>`,
    ),
  ),
  split(
    'row',
    0.5,
    leaf(
      `<p><strong>Opportunities</strong></p><p></p><p>External upside</p><p></p><p>• Which trends can we ride?</p><p>• Untapped segments or channels?</p><p>• Partnerships that unlock growth?</p>`,
    ),
    leaf(
      `<p><strong>Threats</strong></p><p></p><p>External risk</p><p></p><p>• Competitor moves to watch?</p><p>• Market or regulation shifts?</p><p>• Dependencies that could break?</p>`,
    ),
  ),
)

/**
 * Meeting Board — agenda strip on top, then notes | actions cut below.
 *
 *   ┌────────────────────────┐
 *   │        Agenda          │
 *   ├────────────┬───────────┤
 *   │ Discussion │  Actions  │
 *   └────────────┴───────────┘
 */
const MEETING_LAYOUT = split(
  'column',
  0.28,
  leaf(
    `<p><strong>Agenda</strong></p><p></p><p>1. </p><p>2. </p><p>3. </p><p></p><p>Goal for this meeting:</p>`,
  ),
  split(
    'row',
    0.62,
    leaf(
      `<p><strong>Discussion</strong></p><p></p><p>Live notes — capture points as you go.</p><p></p><p>• </p>`,
    ),
    leaf(
      `<p><strong>Action items</strong></p><p></p><p>• Task — owner — due</p><p></p><p><strong>Decisions</strong></p><p>• </p>`,
    ),
  ),
)

/**
 * Competitive Map — hero "Us" pane, then a cut stack of rivals + whitespace.
 *
 *   ┌────────────────┬──────────┐
 *   │                │ Rival A  │
 *   │       Us       ├──────────┤
 *   │                │ Rival B  │
 *   │                ├──────────┤
 *   │                │ Whitespace│
 *   └────────────────┴──────────┘
 */
const COMPETITIVE_LAYOUT = split(
  'row',
  0.64,
  leaf(
    `<p><strong>Us</strong></p><p></p><p>Positioning</p><p></p><p>• Core value prop</p><p>• Ideal customer</p><p>• Moat / differentiator</p><p>• Proof points</p>`,
  ),
  split(
    'column',
    0.34,
    leaf(
      `<p><strong>Competitor A</strong></p><p></p><p>• Strengths</p><p>• Weaknesses</p><p>• Pricing / motion</p>`,
    ),
    split(
      'column',
      0.5,
      leaf(
        `<p><strong>Competitor B</strong></p><p></p><p>• Strengths</p><p>• Weaknesses</p><p>• Pricing / motion</p>`,
      ),
      leaf(
        `<p><strong>Whitespace</strong></p><p></p><p>• Underserved needs</p><p>• Messaging angles</p><p>• Next experiment</p>`,
      ),
    ),
  ),
)

export const BUILTIN_TEMPLATES: BoardTemplate[] = [
  builtin('builtin-swot', 'SWOT Analysis', SWOT_LAYOUT),
  builtin('builtin-meeting', 'Meeting Board', MEETING_LAYOUT),
  builtin('builtin-competitive', 'Competitive Map', COMPETITIVE_LAYOUT),
]

export function isBuiltinTemplateId(id: string): boolean {
  return id.startsWith('builtin-')
}

/** Built-ins always lead the list; user templates follow (builtins never duplicated). */
export function mergeBuiltinTemplates(
  saved: BoardTemplate[],
): BoardTemplate[] {
  const builtinIds = new Set(BUILTIN_TEMPLATES.map((item) => item.id))
  const user = saved.filter((item) => !builtinIds.has(item.id))
  return [...BUILTIN_TEMPLATES, ...user]
}
