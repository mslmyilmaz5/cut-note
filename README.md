# Cut Note

A lightweight macOS note app. Open to a black board, write immediately, then cut panes with scissors — each piece becomes its own note.

## Develop

```bash
npm install
npm run tauri:dev
```

Frontend-only (browser, localStorage):

```bash
npm run dev
```

## Build

```bash
npm run tauri:build
```

The `.app` bundle is written under `src-tauri/target/release/bundle/macos/`.

## Shortcuts

| Shortcut | Action |
| --- | --- |
| `⌘⇧C` | Toggle scissors cut mode |
| `⌘S` | Save board as `.cutnote` |
| `⌘O` | Import a `.cutnote` board |
| `⌘T` | Toggle templates |
| `⌘L` | Toggle notes list |
| `Esc` | Exit cut mode / close panels |
| `⌘Z` / `⌘⇧Z` | Undo / redo board cuts (when not typing) |

## Save / Import (`.cutnote`)

Use **Save** in the title bar to export the current board (layout + all note content) as a `.cutnote` file. Use **Import** (or `⌘O`) to load one back.

## Templates

Split the board into panes, open **Templates**, and save the current layout. Later, pick a template to start a fresh board with the same structure (empty notes).
