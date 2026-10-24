/**
 * Renders the example's app icons into every PNG `app.config.ts` names: `yarn icons:render` from apps/example.
 *
 * Each icon is one SVG in `sources/`, drawn once on a 1024 pt canvas with its palettes as CSS. A render picks the
 * appearance with a class on the root and hides the layers it does not want, so the iOS appearances and the Android
 * layers can never drift apart:
 *
 *   light, dark, tinted                  the iOS appearances (dark has no background: iOS draws its own)
 *   background, foreground, monochrome   the Android adaptive icon's layers, at the iOS geometry: `foregroundScale` in
 *                                        app.config.ts fits them into the safe zone
 *
 * `glass.icon` is an Icon Composer document and needs no render: the plugin copies it into the Xcode project. Its
 * previews for the example's screens come from Icon Composer's own `icontool`, when it is installed.
 * `dark-backdrop.png` is the gradient iOS puts behind a dark icon, for the example's previews of them.
 *
 * Needs `rsvg-convert` (librsvg: `brew install librsvg`).
 */
import {execFileSync} from 'node:child_process'
import {existsSync} from 'node:fs'
import {mkdir, readFile, rm, writeFile} from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const ROOT = import.meta.dirname
const SIZE = 1024
const ICONTOOL = '/Applications/Icon Composer.app/Contents/Executables/icontool'
/** icontool writes 16-bit PNGs: at half size, a preview stays a few hundred kilobytes. */
const PREVIEW_SIZE = 512

/** What every appearance hides or repaints, after the icon's own palette so it wins. */
const SHARED_STYLE = `
  .dark .background, .foreground .background, .monochrome .background { display: none }
  .background-layer .motif { display: none }
  .monochrome .ink { fill: #FFF }
`

const DARK_BACKDROP = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
  <linearGradient id="backdrop" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#3A3A3D"/>
    <stop offset="1" stop-color="#141416"/>
  </linearGradient>
  <rect width="${SIZE}" height="${SIZE}" fill="url(#backdrop)"/>
</svg>`

const IOS = [
  ['light', 'light'],
  ['dark', 'dark'],
  ['tinted', 'tinted'],
]

const ANDROID = [
  ['background', 'background-layer'],
  ['foreground', 'foreground'],
  ['monochrome', 'monochrome'],
]

/**
 * The icons, and the platforms each one ships on. `sunrise` is the app's primary icon, which Expo's `adaptiveIcon`
 * places as it is, with no scale: its Android layers are rendered into the safe zone (two thirds of the canvas, the
 * same share of the 72 dp Android shows as the artwork takes of the iOS icon). `clover` is Android only, on the
 * `backgroundColor` its config names, so it has no background layer.
 */
const ICONS = {
  clover: {android: {background: false}},
  midnight: {android: {}, ios: true},
  mint: {android: {}, ios: true},
  mono: {android: {}, ios: true},
  sunrise: {android: {scale: 2 / 3}, ios: true},
}

const temporary = path.join(os.tmpdir(), `app-icons-${process.pid}`)

/** Renders an SVG at `scale` of the canvas, centred on a full 1024 pt page. */
const render = async (svg, output, scale = 1) => {
  const source = path.join(temporary, 'render.svg')
  const size = Math.round(SIZE * scale)
  const inset = String((SIZE - size) / 2)

  await writeFile(source, svg)
  execFileSync('rsvg-convert', [
    '--width',
    String(size),
    '--height',
    String(size),
    '--page-width',
    String(SIZE),
    '--page-height',
    String(SIZE),
    '--left',
    inset,
    '--top',
    inset,
    '--output',
    output,
    source,
  ])
}

const appearance = (svg, variant) =>
  svg.replace('<svg ', `<svg class="${variant}" `).replace('</svg>', `<style>${SHARED_STYLE}</style></svg>`)

await mkdir(temporary, {recursive: true})

for (const [name, icon] of Object.entries(ICONS)) {
  const svg = await readFile(path.join(ROOT, 'sources', `${name}.svg`), 'utf8')
  const directory = path.join(ROOT, name)

  await mkdir(directory, {recursive: true})

  for (const [file, variant] of icon.ios ? IOS : []) {
    await render(appearance(svg, variant), path.join(directory, `${file}.png`))
  }

  const layers = ANDROID.filter(([file]) => file !== 'background' || icon.android?.background !== false)

  for (const [file, variant] of icon.android ? layers : []) {
    const scale = file === 'background' ? 1 : (icon.android.scale ?? 1)
    await render(appearance(svg, variant), path.join(directory, `${file}.png`), scale)
  }

  console.log(`rendered ${name}`)
}

await render(DARK_BACKDROP, path.join(ROOT, 'dark-backdrop.png'))

if (existsSync(ICONTOOL)) {
  const directory = path.join(ROOT, 'glass')

  await mkdir(directory, {recursive: true})

  for (const [file, rendition] of [
    ['light', 'Default'],
    ['dark', 'Dark'],
    ['tinted', 'Mono'],
  ]) {
    // icontool takes absolute paths only.
    execFileSync(ICONTOOL, [
      path.join(ROOT, 'glass.icon'),
      '--export-preview',
      'iOS',
      rendition,
      String(PREVIEW_SIZE),
      String(PREVIEW_SIZE),
      '1',
      path.join(directory, `${file}.png`),
    ])
  }

  console.log('rendered the glass previews')
} else {
  console.log('icontool not found: the glass previews stay as they are')
}

await rm(temporary, {force: true, recursive: true})
