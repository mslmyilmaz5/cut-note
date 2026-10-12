const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i

/** `#abc` / `abc` / `#aabbcc` → `#aabbcc`, or null when not a hex color. */
export function normalizeHex(value: string): string | null {
  const match = HEX_RE.exec(value.trim())
  if (!match) return null
  const digits = match[1].length === 3
    ? match[1].split('').map((c) => c + c).join('')
    : match[1]
  return `#${digits.toLowerCase()}`
}

function channel(value: number): string {
  return Math.round(Math.min(255, Math.max(0, value))).toString(16).padStart(2, '0')
}

/**
 * Resolve any CSS color the editor stores (hex, rgb(), or a theme variable such
 * as `var(--note-rose)`) to `#rrggbb` for the native color input.
 */
export function cssColorToHex(css: string | undefined, fallbackVar = '--ink'): string {
  let value = css?.trim() || `var(${fallbackVar})`

  const variable = /^var\((--[\w-]+)\)$/.exec(value)
  if (variable) {
    const root = document.querySelector('.app') ?? document.documentElement
    value = getComputedStyle(root).getPropertyValue(variable[1]).trim()
  }

  const hex = normalizeHex(value)
  if (hex) return hex

  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(value)
  if (rgb) return `#${channel(+rgb[1])}${channel(+rgb[2])}${channel(+rgb[3])}`

  return '#ffffff'
}
