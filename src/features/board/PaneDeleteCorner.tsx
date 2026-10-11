type Props = {
  onDelete: () => void
}

export function PaneDeleteCorner({ onDelete }: Props) {
  return (
    <div className="pane-delete">
      <button
        type="button"
        className="pane-delete__hit"
        aria-label="Delete note"
        title="Delete note"
        onMouseDown={(event) => event.preventDefault()}
        onClick={(event) => {
          event.stopPropagation()
          onDelete()
        }}
      >
        {/* Layer revealed under the folded corner */}
        <span className="pane-delete__under" aria-hidden>
          <svg
            className="pane-delete__icon"
            width="13"
            height="13"
            viewBox="0 0 14 14"
            fill="none"
          >
            <path
              d="M3.5 3.5 10.5 10.5M10.5 3.5 3.5 10.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </span>

        {/* Folding paper corner (dog-ear) */}
        <span className="pane-delete__ear" aria-hidden>
          <span className="pane-delete__ear-front" />
          <span className="pane-delete__ear-back" />
          <span className="pane-delete__ear-shade" />
        </span>

        <span className="pane-delete__dot" aria-hidden />
      </button>
    </div>
  )
}
