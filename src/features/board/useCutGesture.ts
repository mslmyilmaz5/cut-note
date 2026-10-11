import {
  useCallback,
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { MAX_RATIO, MIN_RATIO } from './splitTree'
import type { CutAnchor, CutDirection, CutPreview, CutPull } from './types'

const LOCK_THRESHOLD = 10
const CLICK_THRESHOLD = 6
const MIN_DRAW = 0.1
const SEVER_MS = 300

type Point = { x: number; y: number }

type ActiveGesture = {
  noteId: string
  start: Point
  bounds: DOMRect
  mode: 'place' | 'draw'
  locked: CutDirection | null
  pull: CutPull | null
}

type Options = {
  enabled: boolean
  anchor: CutAnchor | null
  onPlaceAnchor: (anchor: CutAnchor) => void
  onPreview: (preview: CutPreview | null) => void
  onCommit: (preview: CutPreview) => void
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function pointInPane(bounds: DOMRect, point: Point): { x: number; y: number } {
  return {
    x: clamp01((point.x - bounds.left) / bounds.width),
    y: clamp01((point.y - bounds.top) / bounds.height),
  }
}

function buildPreview(
  anchor: CutAnchor,
  direction: CutDirection,
  pull: CutPull,
  tipPoint: Point,
  bounds: DOMRect,
): CutPreview | null {
  const tipPos = pointInPane(bounds, tipPoint)

  if (direction === 'row') {
    const ratio = anchor.x
    if (ratio < MIN_RATIO || ratio > MAX_RATIO) return null
    const origin = anchor.y
    let tip = tipPos.y
    if (pull === 'down') tip = Math.max(origin, tip)
    if (pull === 'up') tip = Math.min(origin, tip)
    return {
      noteId: anchor.noteId,
      direction,
      ratio,
      contentSide: 'first',
      origin,
      tip,
      pull,
      phase: 'drawing',
    }
  }

  const ratio = anchor.y
  if (ratio < MIN_RATIO || ratio > MAX_RATIO) return null
  const origin = anchor.x
  let tip = tipPos.x
  if (pull === 'right') tip = Math.max(origin, tip)
  if (pull === 'left') tip = Math.min(origin, tip)
  return {
    noteId: anchor.noteId,
    direction,
    ratio,
    contentSide: 'first',
    origin,
    tip,
    pull,
    phase: 'drawing',
  }
}

function resolveLock(
  dx: number,
  dy: number,
): { direction: CutDirection; pull: CutPull } | null {
  const absX = Math.abs(dx)
  const absY = Math.abs(dy)
  if (absX < LOCK_THRESHOLD && absY < LOCK_THRESHOLD) return null
  if (absX >= absY) {
    return { direction: 'column', pull: dx >= 0 ? 'right' : 'left' }
  }
  return { direction: 'row', pull: dy >= 0 ? 'down' : 'up' }
}

export function useCutGesture({
  enabled,
  anchor,
  onPlaceAnchor,
  onPreview,
  onCommit,
}: Options) {
  const activeRef = useRef<ActiveGesture | null>(null)
  const anchorRef = useRef(anchor)
  const severTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    anchorRef.current = anchor
  }, [anchor])

  useEffect(() => {
    return () => {
      if (severTimerRef.current) clearTimeout(severTimerRef.current)
    }
  }, [])

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>, noteId: string) => {
      if (!enabled || event.button !== 0) return
      if (severTimerRef.current) return
      event.preventDefault()

      const bounds = event.currentTarget.getBoundingClientRect()
      const currentAnchor = anchorRef.current
      const mode: 'place' | 'draw' =
        currentAnchor && currentAnchor.noteId === noteId ? 'draw' : 'place'

      activeRef.current = {
        noteId,
        start: { x: event.clientX, y: event.clientY },
        bounds,
        mode,
        locked: null,
        pull: null,
      }
      event.currentTarget.setPointerCapture(event.pointerId)
    },
    [enabled],
  )

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const active = activeRef.current
      if (!active || severTimerRef.current) return

      const point = { x: event.clientX, y: event.clientY }
      const dx = point.x - active.start.x
      const dy = point.y - active.start.y

      if (active.mode === 'place') {
        // Placement is a click; ignore drag previews.
        return
      }

      const currentAnchor = anchorRef.current
      if (!currentAnchor || currentAnchor.noteId !== active.noteId) return

      if (!active.locked) {
        const lock = resolveLock(dx, dy)
        if (!lock) {
          onPreview(null)
          return
        }
        active.locked = lock.direction
        active.pull = lock.pull
      }

      if (!active.locked || !active.pull) return

      // Allow reversing along the locked axis.
      if (active.locked === 'column') {
        active.pull = dx >= 0 ? 'right' : 'left'
      } else {
        active.pull = dy >= 0 ? 'down' : 'up'
      }

      onPreview(
        buildPreview(
          currentAnchor,
          active.locked,
          active.pull,
          point,
          active.bounds,
        ),
      )
    },
    [onPreview],
  )

  const endGesture = useCallback(
    (event: ReactPointerEvent<HTMLElement>, commit: boolean) => {
      const active = activeRef.current
      if (!active) return
      activeRef.current = null

      try {
        event.currentTarget.releasePointerCapture(event.pointerId)
      } catch {
        // Capture may already be released.
      }

      if (severTimerRef.current) return

      const point = { x: event.clientX, y: event.clientY }
      const travel = Math.hypot(point.x - active.start.x, point.y - active.start.y)

      if (active.mode === 'place') {
        onPreview(null)
        if (travel <= CLICK_THRESHOLD) {
          const pos = pointInPane(active.bounds, active.start)
          onPlaceAnchor({
            noteId: active.noteId,
            x: pos.x,
            y: pos.y,
          })
        }
        return
      }

      const currentAnchor = anchorRef.current

      // Click again to move the point instead of cutting.
      if (travel <= CLICK_THRESHOLD && !active.locked) {
        onPreview(null)
        const pos = pointInPane(active.bounds, active.start)
        onPlaceAnchor({
          noteId: active.noteId,
          x: pos.x,
          y: pos.y,
        })
        return
      }

      if (!commit || !currentAnchor || !active.locked || !active.pull) {
        onPreview(null)
        return
      }

      const preview = buildPreview(
        currentAnchor,
        active.locked,
        active.pull,
        point,
        active.bounds,
      )

      if (!preview || Math.abs(preview.tip - preview.origin) < MIN_DRAW) {
        onPreview(null)
        return
      }

      onPreview({
        ...preview,
        origin: 0,
        tip: 1,
        phase: 'severing',
      })

      severTimerRef.current = setTimeout(() => {
        severTimerRef.current = null
        onPreview(null)
        onCommit(preview)
      }, SEVER_MS)
    },
    [onCommit, onPlaceAnchor, onPreview],
  )

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      endGesture(event, true)
    },
    [endGesture],
  )

  const onPointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      endGesture(event, false)
    },
    [endGesture],
  )

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  }
}
