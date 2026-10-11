import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { useBoardStore } from '../features/notes/store'

function ScissorsIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={active ? 'icon-active' : undefined}
    >
      <circle cx="6" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="6" cy="18" r="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M8.2 7.8 20 18M8.2 16.2 20 6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

function BoardIcon({ theme }: { theme: 'black' | 'white' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect
        x="1.5"
        y="1.5"
        width="13"
        height="13"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.4"
        fill={theme === 'black' ? 'currentColor' : 'transparent'}
        opacity={theme === 'black' ? 0.85 : 1}
      />
      {theme === 'white' ? (
        <path
          d="M5 8h6M8 5v6"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      ) : null}
    </svg>
  )
}

function TemplateIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="1.5" y="1.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="8.5" y="1.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="1.5" y="8.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="8.5" y="8.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}

export function TitleBar() {
  const cutMode = useBoardStore((s) => s.cutMode)
  const notesOpen = useBoardStore((s) => s.notesOpen)
  const templatesOpen = useBoardStore((s) => s.templatesOpen)
  const theme = useBoardStore((s) => s.theme)
  const documentError = useBoardStore((s) => s.documentError)
  const saving = useBoardStore((s) => s.saveMenuOpen)
  const setCutMode = useBoardStore((s) => s.setCutMode)
  const setNotesOpen = useBoardStore((s) => s.setNotesOpen)
  const setTemplatesOpen = useBoardStore((s) => s.setTemplatesOpen)
  const toggleTheme = useBoardStore((s) => s.toggleTheme)
  const saveCutNoteDocument = useBoardStore((s) => s.saveCutNoteDocument)
  const importCutNoteDocument = useBoardStore((s) => s.importCutNoteDocument)
  const clearDocumentError = useBoardStore((s) => s.clearDocumentError)
  const setSaveMenuOpen = useBoardStore((s) => s.setSaveMenuOpen)

  const [name, setName] = useState('Untitled')
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const saveWrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!saving) return
    setName('Untitled')
    clearDocumentError()
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [saving, clearDocumentError])

  useEffect(() => {
    if (!saving) return
    const onPointerDown = (event: PointerEvent) => {
      if (!saveWrapRef.current?.contains(event.target as Node)) {
        setSaveMenuOpen(false)
      }
    }
    window.addEventListener('pointerdown', onPointerDown)
    return () => window.removeEventListener('pointerdown', onPointerDown)
  }, [saving, setSaveMenuOpen])

  const commitSave = async (event?: FormEvent) => {
    event?.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      inputRef.current?.focus()
      return
    }
    setBusy(true)
    try {
      const ok = await saveCutNoteDocument(trimmed)
      if (ok) setSaveMenuOpen(false)
    } finally {
      setBusy(false)
    }
  }

  const handleImport = async () => {
    clearDocumentError()
    setSaveMenuOpen(false)
    setBusy(true)
    try {
      await importCutNoteDocument()
    } finally {
      setBusy(false)
    }
  }

  return (
    <header className="titlebar" data-tauri-drag-region>
      <div className="titlebar__brand" data-tauri-drag-region>
        Cut Note
      </div>
      <div className="titlebar__actions">
        <div className="titlebar__save-wrap" ref={saveWrapRef}>
          <button
            type="button"
            className={`toolbar-btn${saving ? ' toolbar-btn--active' : ''}`}
            aria-expanded={saving}
            aria-label="Save board"
            title="Save (⌘S)"
            disabled={busy}
            onClick={() => setSaveMenuOpen(!saving)}
          >
            Save
          </button>
          {saving ? (
            <form
              className="titlebar-save-popover"
              onSubmit={(event) => void commitSave(event)}
            >
              <label className="titlebar-save-popover__label" htmlFor="doc-name">
                File name
              </label>
              <input
                id="doc-name"
                ref={inputRef}
                className="titlebar-save-popover__input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Untitled"
                maxLength={60}
                autoComplete="off"
                disabled={busy}
              />
              <button
                type="submit"
                className="titlebar-save-popover__btn"
                disabled={busy}
              >
                Save .cutnote
              </button>
              {documentError ? (
                <p className="titlebar-save-popover__error" role="alert">
                  {documentError}
                </p>
              ) : null}
            </form>
          ) : null}
        </div>
        <button
          type="button"
          className="toolbar-btn"
          aria-label="Import board"
          title="Import (⌘O)"
          disabled={busy}
          onClick={() => void handleImport()}
        >
          Import
        </button>
        {documentError && !saving ? (
          <span className="titlebar__error" role="alert" title={documentError}>
            Import failed
          </span>
        ) : null}
        <button
          type="button"
          className="toolbar-btn"
          aria-label={theme === 'black' ? 'Switch to white board' : 'Switch to black board'}
          title={theme === 'black' ? 'White board' : 'Black board'}
          onClick={() => toggleTheme()}
        >
          <BoardIcon theme={theme} />
          <span>{theme === 'black' ? 'Black' : 'White'}</span>
        </button>
        <button
          type="button"
          className={`toolbar-btn${cutMode ? ' toolbar-btn--active' : ''}`}
          aria-pressed={cutMode}
          aria-label="Scissors cut mode"
          title="Cut (⌘⇧C)"
          onClick={() => setCutMode(!cutMode)}
        >
          <ScissorsIcon active={cutMode} />
          <span>Cut</span>
        </button>
        <button
          type="button"
          className={`toolbar-btn${templatesOpen ? ' toolbar-btn--active' : ''}`}
          aria-pressed={templatesOpen}
          aria-label="Templates"
          title="Templates (⌘T)"
          onClick={() => setTemplatesOpen(!templatesOpen)}
        >
          <TemplateIcon />
          <span>Templates</span>
        </button>
        <button
          type="button"
          className={`toolbar-btn${notesOpen ? ' toolbar-btn--active' : ''}`}
          aria-pressed={notesOpen}
          aria-label="Notes list"
          title="Notes (⌘L)"
          onClick={() => setNotesOpen(!notesOpen)}
        >
          Notes
        </button>
      </div>
    </header>
  )
}
