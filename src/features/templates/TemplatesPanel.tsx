import { AnimatePresence, motion } from 'motion/react'
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from 'react'
import { collectNoteIds } from '../board/splitTree'
import { useBoardStore } from '../notes/store'
import { isBuiltinTemplateId } from './builtins'
import type { TemplatePane } from './types'

function LayoutPreview({ layout }: { layout: TemplatePane }) {
  if (layout.type === 'leaf') {
    return <span className="tpl-preview__cell" />
  }
  return (
    <span
      className={`tpl-preview__split tpl-preview__split--${layout.direction}`}
      style={{ '--ratio': String(layout.ratio) } as CSSProperties}
    >
      <LayoutPreview layout={layout.first} />
      <LayoutPreview layout={layout.second} />
    </span>
  )
}

function formatTime(ts: number): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(ts)
}

export function TemplatesPanel() {
  const open = useBoardStore((s) => s.templatesOpen)
  const templates = useBoardStore((s) => s.templates)
  const root = useBoardStore((s) => s.root)
  const setTemplatesOpen = useBoardStore((s) => s.setTemplatesOpen)
  const saveCurrentAsTemplate = useBoardStore((s) => s.saveCurrentAsTemplate)
  const applyTemplate = useBoardStore((s) => s.applyTemplate)
  const deleteTemplate = useBoardStore((s) => s.deleteTemplate)
  const paneCount = collectNoteIds(root).length

  const [naming, setNaming] = useState(false)
  const [name, setName] = useState('')
  const [withNotes, setWithNotes] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) {
      setNaming(false)
      setName('')
    }
  }, [open])

  useEffect(() => {
    if (!naming) return
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [naming])

  const startNaming = () => {
    setName(`${paneCount}-pane board`)
    setNaming(true)
  }

  const cancelNaming = () => {
    setNaming(false)
    setName('')
  }

  const commitSave = (event?: FormEvent) => {
    event?.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      inputRef.current?.focus()
      return
    }
    saveCurrentAsTemplate(trimmed, withNotes)
    setNaming(false)
    setName('')
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.aside
          className="templates-panel"
          initial={{ x: '100%', opacity: 0.6 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0.6 }}
          transition={{ type: 'spring', stiffness: 380, damping: 36 }}
        >
          <header className="templates-panel__header">
            <h2>Templates</h2>
            <button
              type="button"
              className="icon-btn"
              aria-label="Close templates"
              onClick={() => setTemplatesOpen(false)}
            >
              ✕
            </button>
          </header>

          <div className="templates-panel__save">
            {naming ? (
              <form className="templates-panel__name-form" onSubmit={commitSave}>
                <div
                  className="templates-panel__mode"
                  role="radiogroup"
                  aria-label="What to save"
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={withNotes}
                    className={`templates-panel__mode-btn${withNotes ? ' templates-panel__mode-btn--on' : ''}`}
                    onClick={() => setWithNotes(true)}
                  >
                    With notes
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={!withNotes}
                    className={`templates-panel__mode-btn${!withNotes ? ' templates-panel__mode-btn--on' : ''}`}
                    onClick={() => setWithNotes(false)}
                  >
                    Layout only
                  </button>
                </div>
                <label className="templates-panel__name-label" htmlFor="tpl-name">
                  Name
                </label>
                <input
                  id="tpl-name"
                  ref={inputRef}
                  className="templates-panel__name-input"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Four squares"
                  maxLength={60}
                  autoComplete="off"
                />
                <div className="templates-panel__name-actions">
                  <button
                    type="button"
                    className="templates-panel__cancel-btn"
                    onClick={cancelNaming}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="templates-panel__save-btn">
                    Save
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                className="templates-panel__save-btn"
                onClick={startNaming}
              >
                Save current board
              </button>
            )}
            <p className="templates-panel__hint">
              {!naming
                ? `Save this ${paneCount}-pane board with its notes, or just its layout.`
                : withNotes
                  ? `Saves the ${paneCount}-pane layout and every note's text and style.`
                  : `Saves only the ${paneCount}-pane layout; notes start empty.`}
            </p>
          </div>

          <ul className="templates-panel__list">
            {templates.length === 0 ? (
              <li className="templates-panel__empty">Nothing saved yet</li>
            ) : (
              templates.map((tpl) => {
                const builtin = isBuiltinTemplateId(tpl.id)
                return (
                  <li key={tpl.id} className="templates-item">
                    <button
                      type="button"
                      className="templates-item__main"
                      onClick={() => {
                        applyTemplate(tpl.id)
                        setTemplatesOpen(false)
                      }}
                    >
                      <span className="tpl-preview" aria-hidden>
                        <LayoutPreview layout={tpl.layout} />
                      </span>
                      <span className="templates-item__meta">
                        <span className="templates-item__title">{tpl.name}</span>
                        <span className="templates-item__sub">
                          {tpl.paneCount} pane{tpl.paneCount === 1 ? '' : 's'} ·{' '}
                          {builtin
                            ? 'built-in'
                            : tpl.withNotes
                              ? 'with notes'
                              : 'layout'}
                          {builtin ? '' : ` · ${formatTime(tpl.createdAt)}`}
                        </span>
                      </span>
                    </button>
                    {builtin ? null : (
                      <button
                        type="button"
                        className="templates-item__delete"
                        aria-label={`Delete ${tpl.name}`}
                        onClick={() => deleteTemplate(tpl.id)}
                      >
                        Delete
                      </button>
                    )}
                  </li>
                )
              })
            )}
          </ul>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  )
}
