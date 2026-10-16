import { useEffect, useState } from 'react'

function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

/**
 * Tracks native window fullscreen (macOS green button / ⌃⌘F).
 * Native side also drops the unified NSToolbar in fullscreen so the HTML
 * titlebar is not swallowed by the auto-hiding toolbar chrome.
 */
export function useFullscreen(): boolean {
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    if (!isTauri()) return

    let cancelled = false
    let unlistenResize: (() => void) | undefined

    void (async () => {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window')
        const win = getCurrentWindow()
        const sync = async () => {
          const next = await win.isFullscreen()
          if (!cancelled) setFullscreen(next)
        }
        await sync()
        unlistenResize = await win.onResized(() => {
          void sync()
        })
      } catch {
        // Browser / unsupported — leave false.
      }
    })()

    return () => {
      cancelled = true
      unlistenResize?.()
    }
  }, [])

  return fullscreen
}
