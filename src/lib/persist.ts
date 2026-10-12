import type { BoardSnapshot } from '../features/board/types'
import type { BoardTemplate } from '../features/templates/types'

const STORE_PATH = 'cut-note.json'
const BOARD_KEY = 'board'
const TEMPLATES_KEY = 'templates'
const LOCAL_BOARD_KEY = 'cut-note:board'
const LOCAL_TEMPLATES_KEY = 'cut-note:templates'

function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

export async function loadBoard(): Promise<BoardSnapshot | null> {
  try {
    if (isTauri()) {
      const { load } = await import('@tauri-apps/plugin-store')
      const store = await load(STORE_PATH, { autoSave: false, defaults: {} })
      const value = await store.get<BoardSnapshot>(BOARD_KEY)
      return value ?? null
    }
    const raw = localStorage.getItem(LOCAL_BOARD_KEY)
    if (!raw) return null
    return JSON.parse(raw) as BoardSnapshot
  } catch {
    return null
  }
}

/** Resolves false (never throws) so editing continues when saving fails. */
export async function saveBoard(snapshot: BoardSnapshot): Promise<boolean> {
  try {
    if (isTauri()) {
      const { load } = await import('@tauri-apps/plugin-store')
      const store = await load(STORE_PATH, { autoSave: true, defaults: {} })
      await store.set(BOARD_KEY, snapshot)
      await store.save()
      return true
    }
    localStorage.setItem(LOCAL_BOARD_KEY, JSON.stringify(snapshot))
    return true
  } catch {
    return false
  }
}

export async function loadTemplates(): Promise<BoardTemplate[]> {
  try {
    if (isTauri()) {
      const { load } = await import('@tauri-apps/plugin-store')
      const store = await load(STORE_PATH, { autoSave: false, defaults: {} })
      const value = await store.get<BoardTemplate[]>(TEMPLATES_KEY)
      return Array.isArray(value) ? value : []
    }
    const raw = localStorage.getItem(LOCAL_TEMPLATES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as BoardTemplate[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export async function saveTemplates(templates: BoardTemplate[]): Promise<void> {
  try {
    if (isTauri()) {
      const { load } = await import('@tauri-apps/plugin-store')
      const store = await load(STORE_PATH, { autoSave: true, defaults: {} })
      await store.set(TEMPLATES_KEY, templates)
      await store.save()
      return
    }
    localStorage.setItem(LOCAL_TEMPLATES_KEY, JSON.stringify(templates))
  } catch {
    // Persistence failures should not break editing.
  }
}
