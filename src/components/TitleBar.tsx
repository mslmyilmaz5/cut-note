import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { useBoardStore } from '../features/notes/store'
import { StyleDock } from '../features/style/StyleDock'
import { SaveBadge } from './SaveBadge'
import { useDismiss } from './useDismiss'

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

function ThemeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 2a6 6 0 0 1 0 12z" fill="currentColor" />
    </svg>
  )
}

function NotesIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M2.5 4h11M2.5 8h11M2.5 12h7"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
      <path
        d="M2.5 4 5 6.5 7.5 4"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
  const [fileMenuOpen, setFileMenuOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const saveWrapRef = useRef<HTMLDivElement>(null)
  const closeFileMenu = useCallback(() => setFileMenuOpen(false), [])
  useDismiss(saveWrapRef, fileMenuOpen, closeFileMenu)

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
      <div className="titlebar__group titlebar__group--start" data-tauri-drag-region>
        <div className="titlebar__brand" data-tauri-drag-region>
          Cut Note
        </div>
        <div className="titlebar__save-wrap" ref={saveWrapRef}>
          <button
            type="button"
            className={`toolbar-btn${fileMenuOpen || saving ? ' toolbar-btn--active' : ''}`}
            aria-haspopup="menu"
            aria-expanded={fileMenuOpen}
            disabled={busy}
            onClick={() => {
              setSaveMenuOpen(false)
              setFileMenuOpen(!fileMenuOpen)
            }}
          >
            <span>File</span>
            <ChevronIcon />
          </button>
          {fileMenuOpen ? (
            <div className="toolbar-menu" role="menu">
              <button
                type="button"
                role="menuitem"
                className="toolbar-menu__item"
                onClick={() => {
                  setFileMenuOpen(false)
                  setSaveMenuOpen(true)
                }}
              >
                <span className="toolbar-menu__label">Save as .cutnote…</span>
                <kbd>⌘S</kbd>
              </button>
              <button
                type="button"
                role="menuitem"
                className="toolbar-menu__item"
                onClick={() => {
                  setFileMenuOpen(false)
                  void handleImport()
                }}
              >
                <span className="toolbar-menu__label">Import…</span>
                <kbd>⌘O</kbd>
              </button>
            </div>
          ) : null}
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
        {documentError && !saving ? (
          <span className="titlebar__error" role="alert" title={documentError}>
            Import failed
          </span>
        ) : null}
      </div>

      <div className="titlebar__group titlebar__group--center" data-tauri-drag-region>
        <StyleDock />
        {cutMode ? (
          // Cut mode has no toolbar button (double Tab / ⌘⇧C); show it's on.
          <button
            type="button"
            className="cut-pill"
            title="Exit cut mode (Esc or Tab Tab)"
            onClick={() => setCutMode(false)}
          >
            <ScissorsIcon active />
            <span>Cutting</span>
            <kbd>Esc</kbd>
          </button>
        ) : null}
      </div>

      <div className="titlebar__group titlebar__group--end" data-tauri-drag-region>
        <SaveBadge />
        <span className="titlebar__divider" aria-hidden />
        <button
          type="button"
          className="toolbar-btn toolbar-btn--icon"
          aria-label={theme === 'black' ? 'Switch to white board' : 'Switch to black board'}
          title={`${theme === 'black' ? 'White board' : 'Black board'} (⌘⇧B)`}
          onClick={() => toggleTheme()}
        >
          <ThemeIcon />
        </button>
        <button
          type="button"
          className={`toolbar-btn toolbar-btn--icon${templatesOpen ? ' toolbar-btn--active' : ''}`}
          aria-pressed={templatesOpen}
          aria-label="Templates"
          title="Templates (⌘T)"
          onClick={() => setTemplatesOpen(!templatesOpen)}
        >
          <TemplateIcon />
        </button>
        <button
          type="button"
          className={`toolbar-btn toolbar-btn--icon${notesOpen ? ' toolbar-btn--active' : ''}`}
          aria-pressed={notesOpen}
          aria-label="Notes list"
          title="Notes (⌘L)"
          onClick={() => setNotesOpen(!notesOpen)}
        >
          <NotesIcon />
        </button>
      </div>
    </header>
  )
}
