import {
  CUTNOTE_EXTENSION,
  parseCutNote,
  serializeCutNote,
  suggestedFileName,
  type CutNoteDocument,
} from '../features/document/cutnote'

function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

async function downloadInBrowser(doc: CutNoteDocument): Promise<string | null> {
  const blob = new Blob([serializeCutNote(doc)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = suggestedFileName(doc.name)
  anchor.click()
  URL.revokeObjectURL(url)
  return suggestedFileName(doc.name)
}

async function pickAndReadInBrowser(): Promise<{
  doc: CutNoteDocument
  path: string | null
} | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = `.${CUTNOTE_EXTENSION},application/json`
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) {
        resolve(null)
        return
      }
      void file
        .text()
        .then((raw) => resolve({ doc: parseCutNote(raw), path: file.name }))
        .catch(reject)
    }
    input.addEventListener('cancel', () => resolve(null))
    input.click()
  })
}

export async function saveCutNoteFile(
  doc: CutNoteDocument,
): Promise<string | null> {
  if (!isTauri()) {
    return downloadInBrowser(doc)
  }

  const { save } = await import('@tauri-apps/plugin-dialog')
  const { writeTextFile } = await import('@tauri-apps/plugin-fs')

  const path = await save({
    title: 'Save Cut Note board',
    defaultPath: suggestedFileName(doc.name),
    filters: [
      {
        name: 'Cut Note board',
        extensions: [CUTNOTE_EXTENSION],
      },
    ],
  })

  if (!path) return null
  await writeTextFile(path, serializeCutNote(doc))
  return path
}

export async function openCutNoteFile(): Promise<{
  doc: CutNoteDocument
  path: string | null
} | null> {
  if (!isTauri()) {
    return pickAndReadInBrowser()
  }

  const { open } = await import('@tauri-apps/plugin-dialog')
  const { readTextFile } = await import('@tauri-apps/plugin-fs')

  const selected = await open({
    title: 'Open Cut Note board',
    multiple: false,
    filters: [
      {
        name: 'Cut Note board',
        extensions: [CUTNOTE_EXTENSION],
      },
    ],
  })

  if (!selected || Array.isArray(selected)) return null
  const raw = await readTextFile(selected)
  return { doc: parseCutNote(raw), path: selected }
}
