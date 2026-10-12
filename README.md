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
| `Tab` `Tab` (quickly) | Toggle scissors cut mode (not inside lists, where Tab indents) |
| `⌘⇧C` | Toggle scissors cut mode |
| `⌘⇧B` | Toggle black / white board |
| `⌘S` | Save board as `.cutnote` |
| `⌘O` | Import a `.cutnote` board |
| `⌘T` | Toggle templates |
| `⌘L` | Toggle notes list |
| `Esc` | Exit cut mode / close panels |
| `⌘Z` / `⌘⇧Z` | Undo / redo board cuts (when not typing) |

## Autosave

The board saves automatically. The badge in the title bar shows the state (`Saving…`, `Saved 3 min ago`, or `Not saved` if writing failed); hover it for the exact time.

## Text style

**Aa** in the title bar changes type, size, weight, alignment and lists. Pick a preset color or any color under **Custom** (system color picker or a hex value like `#e07a5f`).

## Save / Import (`.cutnote`)

Use **File → Save as .cutnote…** (or `⌘S`) to export the current board (layout + all note content) as a `.cutnote` file. Use **File → Import…** (or `⌘O`) to load one back.

## Templates

Split the board into panes, open **Templates**, and save the current board either **With notes** (layout plus every note's text and style) or **Layout only** (empty notes). Pick a saved entry to replace the board with it; `⌘Z` undoes that.
