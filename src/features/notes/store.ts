import { create } from 'zustand'
import {
  boardToCutNoteDocument,
  normalizeTemplate,
} from '../document/cutnote'
import { createId } from '../../lib/id'
import { openCutNoteFile, saveCutNoteFile } from '../../lib/documentFile'
import {
  loadBoard,
  loadTemplates,
  saveBoard,
  saveTemplates,
} from '../../lib/persist'
import {
  collectNoteIds,
  removeNoteFromTree,
  splitLeaf,
} from '../board/splitTree'
import {
  DEFAULT_NOTE_STYLE,
  type BoardSnapshot,
  type BoardTheme,
  type CutAnchor,
  type CutDirection,
  type CutPreview,
  type Note,
  type NoteStyle,
  type PaneNode,
} from '../board/types'
import { cycleActiveEditorStyle } from '../editor/editorBridge'
import {
  boardToTemplateLayout,
  countTemplatePanes,
  instantiateTemplate,
} from '../templates/layout'
import type { BoardTemplate } from '../templates/types'
import { normalizeNote } from './format'

const HISTORY_LIMIT = 50

export type StyleAction = 'font' | 'size' | 'weight' | 'align' | 'list' | 'color'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

type BoardStore = {
  root: PaneNode
  notes: Record<string, Note>
  focusedNoteId: string
  theme: BoardTheme
  cutMode: boolean
  cutAnchor: CutAnchor | null
  cutPreview: CutPreview | null
  cutFlashNoteId: string | null
  notesOpen: boolean
  templatesOpen: boolean
  templates: BoardTemplate[]
  hydrated: boolean
  /** Autosave state of the board (not `.cutnote` exports). */
  saveStatus: SaveStatus
  lastSavedAt: number | null
  past: BoardSnapshot[]
  future: BoardSnapshot[]
  hydrate: () => Promise<void>
  setTheme: (theme: BoardTheme) => void
  toggleTheme: () => void
  themeReveal: { id: number; to: BoardTheme } | null
  completeThemeReveal: () => void
  clearThemeReveal: () => void
  setCutMode: (on: boolean) => void
  setCutAnchor: (anchor: CutAnchor | null) => void
  setCutPreview: (preview: CutPreview | null) => void
  clearCutFlash: () => void
  setNotesOpen: (open: boolean) => void
  setTemplatesOpen: (open: boolean) => void
  saveCurrentAsTemplate: (name: string, withNotes: boolean) => void
  saveCutNoteDocument: (name: string) => Promise<boolean>
  importCutNoteDocument: () => Promise<boolean>
  applyTemplate: (id: string) => void
  deleteTemplate: (id: string) => void
  documentError: string | null
  clearDocumentError: () => void
  saveMenuOpen: boolean
  setSaveMenuOpen: (open: boolean) => void
  setFocusedNoteId: (id: string) => void
  updateNoteBody: (id: string, body: string) => void
  updateNoteStyle: (id: string, style: Partial<NoteStyle>) => void
  cycleFocusedStyle: (action: StyleAction) => void
  commitCut: (preview: CutPreview) => void
  deleteNote: (id: string) => void
  undo: () => void
  redo: () => void
}

function createNote(body = '', style: NoteStyle = DEFAULT_NOTE_STYLE): Note {
  const now = Date.now()
  return {
    id: createId(),
    body,
    createdAt: now,
    updatedAt: now,
    style: { ...style },
  }
}

function createInitialState(): BoardSnapshot {
  const note = createNote()
  return {
    root: { type: 'leaf', noteId: note.id },
    notes: { [note.id]: note },
    focusedNoteId: note.id,
  }
}

function snapshotOf(state: BoardSnapshot): BoardSnapshot {
  return {
    root: structuredClone(state.root),
    notes: structuredClone(state.notes),
    focusedNoteId: state.focusedNoteId,
  }
}

let persistTimer: ReturnType<typeof setTimeout> | null = null

let persistRun = 0

function schedulePersist(get: () => BoardStore) {
  if (persistTimer) clearTimeout(persistTimer)
  if (get().saveStatus !== 'saving') useBoardStore.setState({ saveStatus: 'saving' })
  persistTimer = setTimeout(() => {
    persistTimer = null
    const run = ++persistRun
    const { root, notes, focusedNoteId, theme } = get()
    void saveBoard({ root, notes, focusedNoteId, theme }).then((ok) => {
      // A newer save is pending or running; let it report.
      if (run !== persistRun || persistTimer !== null) return
      useBoardStore.setState(
        ok
          ? { saveStatus: 'saved', lastSavedAt: Date.now() }
          : { saveStatus: 'error' },
      )
    })
  }, 300)
}

function scheduleTemplatesPersist(templates: BoardTemplate[]) {
  void saveTemplates(templates)
}

export const useBoardStore = create<BoardStore>((set, get) => ({
  ...createInitialState(),
  theme: 'black',
  cutMode: false,
  cutAnchor: null,
  cutPreview: null,
  cutFlashNoteId: null,
  notesOpen: false,
  templatesOpen: false,
  templates: [],
  hydrated: false,
  saveStatus: 'idle',
  lastSavedAt: null,
  past: [],
  future: [],
  documentError: null,
  saveMenuOpen: false,
  themeReveal: null,

  hydrate: async () => {
    const [saved, templatesRaw] = await Promise.all([
      loadBoard(),
      loadTemplates(),
    ])
    const templates = templatesRaw.map(normalizeTemplate)
    if (saved && saved.root && saved.notes && saved.focusedNoteId) {
      const notes = Object.fromEntries(
        Object.entries(saved.notes).map(([id, note]) => [
          id,
          normalizeNote(note as Note),
        ]),
      )
      set({
        root: saved.root,
        notes,
        focusedNoteId: saved.focusedNoteId,
        theme: saved.theme === 'white' ? 'white' : 'black',
        templates,
        hydrated: true,
      })
      return
    }
    set({ templates, hydrated: true })
  },

  clearDocumentError: () => set({ documentError: null }),

  setSaveMenuOpen: (open) => set({ saveMenuOpen: open }),

  setTheme: (theme) => {
    set({ theme, themeReveal: null })
    schedulePersist(get)
  },

  toggleTheme: () => {
    const state = get()
    if (state.themeReveal) return
    const to: BoardTheme = state.theme === 'black' ? 'white' : 'black'
    set({ themeReveal: { id: Date.now(), to } })
  },

  completeThemeReveal: () => {
    const reveal = get().themeReveal
    if (!reveal) return
    if (get().theme === reveal.to) return
    set({ theme: reveal.to })
    schedulePersist(get)
  },

  clearThemeReveal: () => set({ themeReveal: null }),

  setCutMode: (on) =>
    set(
      on
        ? { cutMode: true }
        : { cutMode: false, cutAnchor: null, cutPreview: null },
    ),

  setCutAnchor: (anchor) =>
    set({
      cutAnchor: anchor,
      cutPreview: null,
    }),

  setCutPreview: (preview) => set({ cutPreview: preview }),

  clearCutFlash: () => set({ cutFlashNoteId: null }),

  setNotesOpen: (open) =>
    set({
      notesOpen: open,
      templatesOpen: open ? false : get().templatesOpen,
    }),

  setTemplatesOpen: (open) =>
    set({
      templatesOpen: open,
      notesOpen: open ? false : get().notesOpen,
    }),

  saveCurrentAsTemplate: (name, withNotes) => {
    const state = get()
    const layout = boardToTemplateLayout(
      state.root,
      withNotes ? state.notes : undefined,
    )
    const template: BoardTemplate = {
      id: createId(),
      name,
      createdAt: Date.now(),
      paneCount: countTemplatePanes(layout),
      withNotes,
      layout,
    }
    const templates = [template, ...state.templates]
    set({ templates })
    scheduleTemplatesPersist(templates)
  },

  saveCutNoteDocument: async (name) => {
    const state = get()
    const doc = boardToCutNoteDocument(name, {
      root: state.root,
      notes: state.notes,
      focusedNoteId: state.focusedNoteId,
      theme: state.theme,
    })

    try {
      const path = await saveCutNoteFile(doc)
      if (!path) return false
      set({ documentError: null })
      return true
    } catch (error) {
      set({
        documentError:
          error instanceof Error
            ? error.message
            : 'Could not save the .cutnote file.',
      })
      return false
    }
  },

  importCutNoteDocument: async () => {
    try {
      const result = await openCutNoteFile()
      if (!result) return false

      const { doc } = result
      const state = get()
      const past = [
        ...state.past,
        snapshotOf({
          root: state.root,
          notes: state.notes,
          focusedNoteId: state.focusedNoteId,
        }),
      ].slice(-HISTORY_LIMIT)

      set({
        root: doc.root,
        notes: doc.notes,
        focusedNoteId: doc.focusedNoteId,
        theme: doc.theme,
        cutMode: false,
        cutAnchor: null,
        cutPreview: null,
        past,
        future: [],
        documentError: null,
      })
      schedulePersist(get)
      return true
    } catch (error) {
      set({
        documentError:
          error instanceof Error
            ? error.message
            : 'Could not import the .cutnote file.',
      })
      return false
    }
  },

  applyTemplate: (id) => {
    const state = get()
    const template = state.templates.find((item) => item.id === id)
    if (!template) return

    const past = [
      ...state.past,
      snapshotOf({
        root: state.root,
        notes: state.notes,
        focusedNoteId: state.focusedNoteId,
      }),
    ].slice(-HISTORY_LIMIT)

    const next = instantiateTemplate(template.layout)
    set({
      root: next.root,
      notes: next.notes,
      focusedNoteId: next.focusedNoteId,
      cutMode: false,
      cutAnchor: null,
      cutPreview: null,
      past,
      future: [],
    })
    schedulePersist(get)
  },

  deleteTemplate: (id) => {
    const templates = get().templates.filter((item) => item.id !== id)
    set({ templates })
    scheduleTemplatesPersist(templates)
  },

  setFocusedNoteId: (id) => {
    set({ focusedNoteId: id })
    schedulePersist(get)
  },

  updateNoteBody: (id, body) => {
    const current = get().notes[id]
    if (!current || current.body === body) return
    set({
      notes: {
        ...get().notes,
        [id]: { ...current, body, updatedAt: Date.now() },
      },
    })
    schedulePersist(get)
  },

  updateNoteStyle: (id, style) => {
    const current = get().notes[id]
    if (!current) return
    set({
      notes: {
        ...get().notes,
        [id]: {
          ...current,
          style: { ...current.style, ...style },
          updatedAt: Date.now(),
        },
      },
    })
    schedulePersist(get)
  },

  cycleFocusedStyle: (action) => {
    cycleActiveEditorStyle(action, get().focusedNoteId)
  },

  commitCut: (preview) => {
    const state = get()
    const source = state.notes[preview.noteId]
    if (!source) return

    const past = [
      ...state.past,
      snapshotOf({
        root: state.root,
        notes: state.notes,
        focusedNoteId: state.focusedNoteId,
      }),
    ].slice(-HISTORY_LIMIT)

    const newNote = createNote('', source.style)
    const root = splitLeaf(
      state.root,
      preview.noteId,
      preview.direction,
      preview.ratio,
      preview.contentSide,
      newNote.id,
    )

    set({
      root,
      notes: { ...state.notes, [newNote.id]: newNote },
      focusedNoteId: preview.noteId,
      cutPreview: null,
      cutAnchor: null,
      cutMode: false,
      cutFlashNoteId: preview.noteId,
      past,
      future: [],
    })
    schedulePersist(get)
  },

  deleteNote: (id) => {
    const state = get()
    const ids = collectNoteIds(state.root)
    if (ids.length <= 1 || !ids.includes(id) || !state.notes[id]) return

    const past = [
      ...state.past,
      snapshotOf({
        root: state.root,
        notes: state.notes,
        focusedNoteId: state.focusedNoteId,
      }),
    ].slice(-HISTORY_LIMIT)

    const nextRoot = removeNoteFromTree(state.root, id)
    if (!nextRoot) return

    const remaining = collectNoteIds(nextRoot)
    if (remaining.length === 0) return

    // Keep notes map aligned with the live tree — orphans create empty black panes.
    const notes = Object.fromEntries(
      remaining
        .map((noteId) => {
          const note = noteId === id ? undefined : state.notes[noteId]
          return note ? ([noteId, note] as const) : null
        })
        .filter((entry): entry is readonly [string, Note] => entry !== null),
    )

    if (remaining.some((noteId) => !notes[noteId])) return

    const focusedNoteId = remaining.includes(state.focusedNoteId)
      ? state.focusedNoteId
      : remaining[0]

    set({
      root: nextRoot,
      notes,
      focusedNoteId,
      cutAnchor:
        state.cutAnchor?.noteId === id ? null : state.cutAnchor,
      cutPreview:
        state.cutPreview?.noteId === id ? null : state.cutPreview,
      past,
      future: [],
    })
    schedulePersist(get)
  },

  undo: () => {
    const state = get()
    const previous = state.past[state.past.length - 1]
    if (!previous) return
    const current = snapshotOf({
      root: state.root,
      notes: state.notes,
      focusedNoteId: state.focusedNoteId,
    })
    set({
      root: previous.root,
      notes: previous.notes,
      focusedNoteId: previous.focusedNoteId,
      past: state.past.slice(0, -1),
      future: [current, ...state.future].slice(0, HISTORY_LIMIT),
      cutPreview: null,
      cutAnchor: null,
      cutMode: false,
    })
    schedulePersist(get)
  },

  redo: () => {
    const state = get()
    const next = state.future[0]
    if (!next) return
    const current = snapshotOf({
      root: state.root,
      notes: state.notes,
      focusedNoteId: state.focusedNoteId,
    })
    set({
      root: next.root,
      notes: next.notes,
      focusedNoteId: next.focusedNoteId,
      past: [...state.past, current].slice(-HISTORY_LIMIT),
      future: state.future.slice(1),
      cutPreview: null,
      cutAnchor: null,
      cutMode: false,
    })
    schedulePersist(get)
  },
}))

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return (
    tag === 'TEXTAREA' ||
    tag === 'INPUT' ||
    target.isContentEditable
  )
}

export type { BoardTheme, CutAnchor, CutDirection, CutPreview, Note, PaneNode }
