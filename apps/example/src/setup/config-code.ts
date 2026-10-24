/** The phone's width in characters of the code block: a longer line puts its value on the next one. */
const LINE = 40

/** What app.config.ts's `art()` expands, so a path prints the way the config writes it. */
const ART = /^\.\/assets\/app-icons\/(.+)\.png$/

const literal = (value: unknown) => {
  if (typeof value !== 'string') {
    return String(value)
  }

  const art = ART.exec(value)

  return art ? `art('${art[1]}')` : `'${value}'`
}

// Sorted as app.config.ts sorts them: the config reaches the app through a native dictionary, which keeps no order.
const print = (value: object, indent: string): string[] =>
  Object.entries(value)
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([key, entry]) => {
      if (entry === undefined) {
        return []
      }

      if (typeof entry === 'object' && entry !== null) {
        return [`${indent}${key}: {`, ...print(entry, `${indent}  `), `${indent}},`]
      }

      const line = `${indent}${key}: ${literal(entry)},`

      return line.length <= LINE ? [line] : [`${indent}${key}:`, `${indent}  ${literal(entry)},`]
    })

/** An icon's entry as the TypeScript that writes it, broken to fit a phone. */
export const entryCode = (name: string, entry: object) => [`${name}: {`, ...print(entry, '  '), '},'].join('\n')

/** Keys of an object as the TypeScript that writes them, at the top level of the config. */
export const keysCode = (value: object) => print(value, '').join('\n')
