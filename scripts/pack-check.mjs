/**
 * Checks what npm would receive, the way a consumer meets it. Packs every published package (each `prepack` builds it
 * through turbo's cache), asserts what must and must not ship in each tarball, then installs it into a throwaway app
 * and type-checks real usage with a consumer's TypeScript: no `source` condition, no workspace links, only what the
 * tarball declares. The config plugin is loaded from the tarball too, the way prebuild loads it.
 *
 * The negative cases matter as much as the positive ones: if a declaration failed to resolve, its imports would
 * quietly become `any` and everything would compile, so each `@ts-expect-error` is there to prove the types are real.
 */
import {execFileSync} from 'node:child_process'
import {existsSync} from 'node:fs'
import {mkdir, readdir, readFile, rm, writeFile} from 'node:fs/promises'
import {createRequire} from 'node:module'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const WORK = path.join(ROOT, '.pack-check')

const run = (command, args, cwd = ROOT) => execFileSync(command, args, {cwd, encoding: 'utf8'})

const fail = message => {
  console.error(`pack-check: ${message}`)
  process.exit(1)
}

const REQUIRED = {
  '@hzblj/expo-app-icons': [
    'package.json',
    'README.md',
    'LICENSE',
    'app.plugin.js',
    'build/index.js',
    'build/index.d.ts',
    'plugin/build/index.js',
    'plugin/build/index.d.ts',
    'plugin/build/types.d.ts',
    'expo-module.config.json',
    'ios/ExpoAppIcons.podspec',
    'ios/ExpoAppIconsModule.swift',
    'ios/AppIcons.swift',
    'ios/AppIconExceptions.swift',
    'android/build.gradle',
    'android/src/main/AndroidManifest.xml',
    'android/src/main/java/com/hzblj/expoappicons/ExpoAppIconsModule.kt',
    'android/src/main/java/com/hzblj/expoappicons/AppIconSwitcher.kt',
    'android/src/main/java/com/hzblj/expoappicons/AppIconPackageReplacedReceiver.kt',
    'android/src/main/java/com/hzblj/expoappicons/AppIconExceptions.kt',
  ],
}

// The TypeScript sources, the plugin's tests and fixtures and the build output of the native projects stay home.
const FORBIDDEN = [/^src\//, /^plugin\/(src|test)\//, /^android\/build\//, /\/build\/intermediates\//, /\.DS_Store$/]

const packages = []

for (const directory of await readdir(path.join(ROOT, 'packages'))) {
  const manifestPath = path.join(ROOT, 'packages', directory, 'package.json')

  if (!existsSync(manifestPath)) {
    continue
  }

  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))

  if (!manifest.private) {
    packages.push({directory, name: manifest.name})
  }
}

await rm(WORK, {force: true, recursive: true})
await mkdir(path.join(WORK, 'tarballs'), {recursive: true})

let fileCount = 0

for (const {directory, name} of packages) {
  const tarball = path.join(WORK, 'tarballs', `${directory}.tgz`)

  run('yarn', ['pack', '--out', tarball], path.join(ROOT, 'packages', directory))

  const files = run('tar', ['-tzf', tarball])
    .split('\n')
    .filter(Boolean)
    .map(file => file.replace(/^package\//, ''))

  const missing = (REQUIRED[name] ?? ['package.json', 'README.md']).filter(file => !files.includes(file))
  const leaked = files.filter(file => FORBIDDEN.some(pattern => pattern.test(file)))

  if (missing.length > 0) {
    fail(`${name} is missing:\n  ${missing.join('\n  ')}`)
  }

  if (leaked.length > 0) {
    fail(`${name} must not ship:\n  ${leaked.join('\n  ')}`)
  }

  const packed = JSON.parse(run('tar', ['-xzOf', tarball, 'package/package.json']))

  if (JSON.stringify(packed.dependencies ?? {}).includes('workspace:')) {
    fail(`${name} still declares a workspace: range: it would not install outside this repo`)
  }

  const installed = path.join(WORK, 'node_modules', name)

  await mkdir(installed, {recursive: true})
  run('tar', ['-xzf', tarball, '-C', installed, '--strip-components', '1'])
  fileCount += files.length
}

// The config plugin, as prebuild requires it: `app.plugin.js` from the tarball, run over a minimal config. It
// validates the options at once and leaves the image work to its mods.
const plugin = createRequire(path.join(WORK, 'package.json'))('@hzblj/expo-app-icons/app.plugin.js')
const withAppIcons = plugin.default ?? plugin

if (typeof withAppIcons !== 'function') {
  fail('app.plugin.js does not export a config plugin')
}

const configured = withAppIcons(
  {name: 'Consumer', slug: 'consumer'},
  {
    icons: {
      summer: {
        android: {foregroundImage: './summer-foreground.png', foregroundScale: 0.75},
        ios: {dark: './summer-dark.png', light: './summer.png'},
      },
    },
  }
)

if (!configured.mods?.ios || !configured.mods?.android) {
  fail('the config plugin registered no iOS or Android mods')
}

let rejected = false

try {
  withAppIcons({name: 'Consumer', slug: 'consumer'}, {icons: {default: {ios: './icon.png'}}})
} catch {
  rejected = true
}

if (!rejected) {
  fail('the config plugin accepted `default`, the primary icon, as an alternate')
}

const consumer = `import {
  AppIcon,
  type AppIconChange,
  type AppIconName,
  type AppIconSubscription,
  DEFAULT_APP_ICON,
  useAppIcon,
} from '@hzblj/expo-app-icons'
import type {AndroidAppIcon, AppIconConfig, AppIconsPluginOptions, IosAppIcon} from '@hzblj/expo-app-icons/plugin'

export const switchTo = async (name: AppIconName): Promise<AppIconChange> => {
  const icons: AppIconName[] = AppIcon.getAvailableIcons()

  if (!AppIcon.isSupported() || !icons.includes(name)) {
    return 'unsupported'
  }

  const current: AppIconName = await AppIcon.getIcon()

  return current === name ? 'unchanged' : AppIcon.setIcon(name)
}

export const reset = (): Promise<AppIconChange> => AppIcon.resetIcon()

export const isPrimary = (name: AppIconName) => name === DEFAULT_APP_ICON

export const subscription: AppIconSubscription = AppIcon.addChangeListener(name => name.toUpperCase())

subscription.remove()

export const usePicker = () => {
  const {icon, icons, isSupported, resetIcon, setIcon} = useAppIcon()
  const label: string = icon ?? 'loading'

  return {choose: (name: AppIconName) => setIcon(name), icons, isSupported, label, resetIcon}
}

const android: AndroidAppIcon = {
  backgroundImage: './assets/background.png',
  foregroundImage: './assets/foreground.png',
  foregroundOffsetY: -2,
  foregroundScale: 0.75,
  monochromeImage: './assets/monochrome.png',
  monochromeScale: 0.7,
}

const ios: IosAppIcon = {dark: './assets/dark.png', light: './assets/light.png', tinted: './assets/tinted.png'}

export const entry: AppIconConfig = {android: {backgroundColor: '#FFFFFF', foregroundImage: './assets/fg.png'}}

export const options: AppIconsPluginOptions = {icons: {black_friday: {android, ios}, glass: {ios: './assets/glass.icon'}}}

// @ts-expect-error: the Android foreground is required
export const noForeground: AndroidAppIcon = {backgroundColor: '#000000'}

// @ts-expect-error: a set of appearances needs its light icon
export const noLight: IosAppIcon = {dark: './assets/dark.png'}

// @ts-expect-error: a scale is a number
export const scale: AndroidAppIcon = {foregroundImage: './assets/fg.png', foregroundScale: '0.75'}

// @ts-expect-error: setIcon takes a name
AppIcon.setIcon(1)

// @ts-expect-error: not a result setIcon resolves with
export const result: AppIconChange = 'applied'
`

await writeFile(path.join(WORK, 'consumer.tsx'), consumer)
await writeFile(
  path.join(WORK, 'tsconfig.json'),
  JSON.stringify(
    {
      compilerOptions: {noEmit: true, skipLibCheck: true, strict: true},
      extends: 'expo/tsconfig.base',
      include: ['consumer.tsx'],
    },
    null,
    2
  )
)

try {
  run('yarn', ['run', '-T', 'tsc', '-p', WORK])
} catch (error) {
  fail(`a consumer's type check failed:\n${error.stdout}`)
}

await rm(WORK, {force: true, recursive: true})

console.log(`pack-check: ${packages.length} package, ${fileCount} files, the plugin runs and a consumer type-checks`)
