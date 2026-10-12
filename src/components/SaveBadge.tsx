import { useEffect, useState } from 'react'
import { useBoardStore } from '../features/notes/store'

function relative(ts: number, now: number): string {
  const seconds = Math.max(0, Math.round((now - ts) / 1000))
  if (seconds < 45) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(ts)
}

function exactTime(ts: number): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(ts)
}

/** Autosave status for the board, e.g. "Saved 3 min ago". */
export function SaveBadge() {
  const status = useBoardStore((s) => s.saveStatus)
  const lastSavedAt = useBoardStore((s) => s.lastSavedAt)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    // Keep the relative time fresh.
    const timer = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  let label: string
  let title: string
  if (status === 'saving') {
    label = 'Saving…'
    title = 'Saving changes'
  } else if (status === 'error') {
    label = 'Not saved'
    title = 'Could not save changes. They will be retried on the next edit.'
  } else if (lastSavedAt) {
    label = `Saved ${relative(lastSavedAt, Math.max(now, lastSavedAt))}`
    title = `Last saved ${exactTime(lastSavedAt)}`
  } else {
    label = 'All changes saved'
    title = 'No changes since opening'
  }

  return (
    <span
      className={`save-badge save-badge--${status}`}
      role="status"
      aria-live="polite"
      title={title}
    >
      <span className="save-badge__dot" aria-hidden />
      {label}
    </span>
  )
}
