import { useEffect } from 'react'
import { ThemeReveal } from './components/ThemeReveal'
import { TitleBar } from './components/TitleBar'
import { Board } from './features/board/Board'
import { NotesList } from './features/notes/NotesList'
import { isTypingTarget, useBoardStore } from './features/notes/store'
import { StyleDock } from './features/style/StyleDock'
import { TemplatesPanel } from './features/templates/TemplatesPanel'

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
        <StyleDock />
      </main>
      <ThemeReveal />
    </div>
  )
}
