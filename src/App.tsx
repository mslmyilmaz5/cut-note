import { useEffect } from 'react'
import { CutHint } from './components/CutHint'
import { ThemeReveal } from './components/ThemeReveal'
import { TitleBar } from './components/TitleBar'
import { Board } from './features/board/Board'
import { NotesList } from './features/notes/NotesList'
import { isTypingTarget, useBoardStore } from './features/notes/store'
import { TemplatesPanel } from './features/templates/TemplatesPanel'

const DOUBLE_TAB_MS = 350

function isCaretInListItem(): boolean {
  const node = window.getSelection()?.anchorNode
  const el = node instanceof HTMLElement ? node : node?.parentElement
  return Boolean(el?.closest('li'))
}

export default function App() {
  const hydrate = useBoardStore((s) => s.hydrate)
  const hydrated = useBoardStore((s) => s.hydrated)
  const theme = useBoardStore((s) => s.theme)
  const cutMode = useBoardStore((s) => s.cutMode)
  const setCutMode = useBoardStore((s) => s.setCutMode)
  const toggleTheme = useBoardStore((s) => s.toggleTheme)
  const cutAnchor = useBoardStore((s) => s.cutAnchor)
  const cutPreview = useBoardStore((s) => s.cutPreview)
  const setCutAnchor = useBoardStore((s) => s.setCutAnchor)
  const setCutPreview = useBoardStore((s) => s.setCutPreview)
  const setNotesOpen = useBoardStore((s) => s.setNotesOpen)
  const setTemplatesOpen = useBoardStore((s) => s.setTemplatesOpen)
  const notesOpen = useBoardStore((s) => s.notesOpen)
  const templatesOpen = useBoardStore((s) => s.templatesOpen)
  const undo = useBoardStore((s) => s.undo)
  const redo = useBoardStore((s) => s.redo)
  const importCutNoteDocument = useBoardStore((s) => s.importCutNoteDocument)
  const setSaveMenuOpen = useBoardStore((s) => s.setSaveMenuOpen)
  const saveMenuOpen = useBoardStore((s) => s.saveMenuOpen)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  // Double Tab toggles cut mode. Capture phase runs before the editor's own Tab handling.
  useEffect(() => {
    let lastTab = -Infinity
    const onTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      if (event.shiftKey || event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target instanceof HTMLElement ? event.target : null
      const tag = target?.tagName
      // Form fields keep normal Tab navigation.
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      const inEditor = Boolean(target?.closest('.ProseMirror'))
      // In lists Tab indents; quick repeated indents must not open cut mode.
      if (inEditor && isCaretInListItem()) {
        lastTab = -Infinity
        return
      }

      const now = performance.now()
      if (now - lastTab < DOUBLE_TAB_MS) {
        lastTab = -Infinity
        event.preventDefault()
        event.stopPropagation()
        const { cutMode: on, setCutMode: toggle } = useBoardStore.getState()
        toggle(!on)
        return
      }
      lastTab = now
      // A single Tab in a note shouldn't move focus out of it.
      if (inEditor) event.preventDefault()
    }
    window.addEventListener('keydown', onTab, true)
    return () => window.removeEventListener('keydown', onTab, true)
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const meta = event.metaKey || event.ctrlKey

      if (event.key === 'Escape') {
        if (cutMode && (cutAnchor || cutPreview)) {
          setCutAnchor(null)
          setCutPreview(null)
          event.preventDefault()
        } else if (cutMode) {
          setCutMode(false)
          event.preventDefault()
        } else if (saveMenuOpen) {
          setSaveMenuOpen(false)
          event.preventDefault()
        } else if (templatesOpen) {
          setTemplatesOpen(false)
          event.preventDefault()
        } else if (notesOpen) {
          setNotesOpen(false)
          event.preventDefault()
        }
        return
      }

      if (meta && event.shiftKey && event.key.toLowerCase() === 'c') {
        event.preventDefault()
        setCutMode(!cutMode)
        return
      }

      if (meta && event.shiftKey && event.key.toLowerCase() === 'b') {
        event.preventDefault()
        toggleTheme()
        return
      }

      if (meta && event.key.toLowerCase() === 't') {
        event.preventDefault()
        setTemplatesOpen(!templatesOpen)
        return
      }

      if (meta && event.key.toLowerCase() === 's') {
        event.preventDefault()
        setSaveMenuOpen(true)
        return
      }

      if (meta && event.key.toLowerCase() === 'o') {
        event.preventDefault()
        void importCutNoteDocument()
        return
      }

      if (meta && event.key.toLowerCase() === 'l') {
        event.preventDefault()
        setNotesOpen(!notesOpen)
        return
      }

      if (meta && event.key.toLowerCase() === 'z') {
        if (isTypingTarget(event.target)) return
        event.preventDefault()
        if (event.shiftKey) redo()
        else undo()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    cutAnchor,
    cutMode,
    cutPreview,
    importCutNoteDocument,
    notesOpen,
    redo,
    saveMenuOpen,
    setCutAnchor,
    setCutMode,
    setCutPreview,
    setNotesOpen,
    setSaveMenuOpen,
    setTemplatesOpen,
    templatesOpen,
    toggleTheme,
    undo,
  ])

  if (!hydrated) {
    return <div className={`app app--loading app--theme-${theme}`} />
  }

  return (
    <div className={`app app--theme-${theme}${cutMode ? ' app--cut' : ''}`}>
      <TitleBar />
      <main className="app__main">
        <Board />
        <NotesList />
        <TemplatesPanel />
        <CutHint />
      </main>
      <ThemeReveal />
    </div>
  )
}
