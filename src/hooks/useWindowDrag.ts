import { useCallback, type PointerEvent as ReactPointerEvent } from 'react'

function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  return Boolean(
    target.closest(
      'button, a, input, textarea, select, label, [role="menu"], [role="menuitem"], [role="slider"], .style-dock, .toolbar-menu, .titlebar-save-popover',
    ),
  )
}

/**
 * macOS overlay titlebars need an explicit `startDragging()` call —
 * `data-tauri-drag-region` alone is unreliable with a unified toolbar.
 */
export function useWindowDrag(enabled = true) {
  return useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!enabled) return
      if (!isTauri()) return
      if (event.button !== 0) return
      if (isInteractiveTarget(event.target)) return

      // Double-click toggles zoom (macOS titlebar convention).
      if (event.detail === 2) {
        void (async () => {
          try {
            const { getCurrentWindow } = await import('@tauri-apps/api/window')
            await getCurrentWindow().toggleMaximize()
          } catch {
            // Permission / platform — ignore.
          }
        })()
        return
      }

      void (async () => {
        try {
          const { getCurrentWindow } = await import('@tauri-apps/api/window')
          await getCurrentWindow().startDragging()
        } catch {
          // Permission / platform — ignore.
        }
      })()
    },
    [enabled],
  )
}
