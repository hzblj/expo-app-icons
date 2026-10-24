import fs from 'node:fs'
import path from 'node:path'
import {generateImageAsync} from '@expo/image-utils'
import {
  AndroidConfig,
  type ConfigPlugin,
  withAndroidColors,
  withAndroidManifest,
  withDangerousMod,
} from 'expo/config-plugins'
import Jimp from 'jimp-compact'

import {DEFAULT_ICON, resolveImage} from './icons'
import type {AndroidIcon, NormalizedIcon} from './types'

type AndroidManifest = AndroidConfig.Manifest.AndroidManifest
type ManifestActivity = AndroidConfig.Manifest.ManifestActivity
type ManifestActivityAlias = AndroidConfig.Manifest.ManifestActivityAlias
type ManifestIntentFilter = AndroidConfig.Manifest.ManifestIntentFilter
type ResourceXML = AndroidConfig.Resources.ResourceXML

const RESOURCE_PREFIX = 'app_icon_'
const ICON_NAME_META_DATA = 'com.hzblj.expoappicons.NAME'
const LEGACY_SIZE = 48
const ADAPTIVE_SIZE = 108
const DENSITIES = {hdpi: 1.5, mdpi: 1, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4}
const MAIN_ACTION = 'android.intent.action.MAIN'
const LAUNCHER_CATEGORY = 'android.intent.category.LAUNCHER'

const resourceName = (icon: NormalizedIcon, suffix = '') => `${RESOURCE_PREFIX}${icon.name}${suffix}`

type LayerOptions = {backgroundColor: string; cacheKey: string; size: number; src: string}
type LegacyOptions = {isRound: boolean; size: number}

const generateLayer = async (projectRoot: string, {backgroundColor, cacheKey, size, src}: LayerOptions) => {
  const {source} = await generateImageAsync(
    {cacheType: `expo-app-icons-android-${cacheKey}`, projectRoot},
    {
      backgroundColor,
      height: size,
      resizeMode: 'cover',
      src: resolveImage(projectRoot, src),
      width: size,
    }
  )

  return source
}

export const generateLegacyIcon = async (projectRoot: string, icon: AndroidIcon, {isRound, size}: LegacyOptions) => {
  const {backgroundColor, backgroundImage, foregroundImage, foregroundScale, foregroundOffsetX, foregroundOffsetY} =
    icon.android
  const canvasColor =
    backgroundColor.length === 9 ? `#${backgroundColor.slice(3)}${backgroundColor.slice(1, 3)}` : backgroundColor
  const canvas = new Jimp(size, size, canvasColor)

  if (backgroundImage !== null) {
    const background = await generateLayer(projectRoot, {
      backgroundColor: 'transparent',
      cacheKey: `${icon.name}-legacy-background`,
      size,
      src: backgroundImage,
    })
    canvas.composite(await Jimp.read(background), 0, 0)
  }

  const foregroundSize = Math.max(1, Math.round(size * foregroundScale))
  const foreground = await generateLayer(projectRoot, {
    backgroundColor: 'transparent',
    cacheKey: `${icon.name}-legacy-foreground`,
    size: foregroundSize,
    src: foregroundImage,
  })
  const centeredOffset = (size - foregroundSize) / 2
  canvas.composite(
    await Jimp.read(foreground),
    Math.round(centeredOffset + (foregroundOffsetX / ADAPTIVE_SIZE) * size),
    Math.round(centeredOffset + (foregroundOffsetY / ADAPTIVE_SIZE) * size)
  )

  if (isRound) {
    canvas.circle()
  }

  return canvas.getBufferAsync(Jimp.MIME_PNG)
}

const fraction = (value: number) => `${Number((value * 100).toFixed(6))}%`

const adaptiveForegroundXml = (icon: AndroidIcon, layer: 'foreground' | 'monochrome', suffix: string) => {
  const drawable = `@mipmap/${resourceName(icon, suffix)}`
  const {foregroundOffsetX, foregroundOffsetY} = icon.android
  const scale = layer === 'monochrome' ? icon.android.monochromeScale : icon.android.foregroundScale

  if (scale === 1 && foregroundOffsetX === 0 && foregroundOffsetY === 0) {
    return `<${layer} android:drawable="${drawable}"/>`
  }

  const inset = (1 - scale) / 2
  const offsetX = foregroundOffsetX / ADAPTIVE_SIZE
  const offsetY = foregroundOffsetY / ADAPTIVE_SIZE

  return `<${layer}><inset android:drawable="${drawable}" android:insetLeft="${fraction(inset + offsetX)}" android:insetTop="${fraction(inset + offsetY)}" android:insetRight="${fraction(inset - offsetX)}" android:insetBottom="${fraction(inset - offsetY)}"/></${layer}>`
}

export const adaptiveIconXml = (icon: AndroidIcon) => {
  const background =
    icon.android.backgroundImage === null
      ? `@color/${resourceName(icon, '_background')}`
      : `@mipmap/${resourceName(icon, '_background')}`
  const layers = [
    `<background android:drawable="${background}"/>`,
    adaptiveForegroundXml(icon, 'foreground', '_foreground'),
  ]

  if (icon.android.monochromeImage !== null) {
    layers.push(adaptiveForegroundXml(icon, 'monochrome', '_monochrome'))
  }

  return `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    ${layers.join('\n    ')}
</adaptive-icon>
`
}

export const removeStaleResources = async (resPath: string) => {
  const directories = await fs.promises.readdir(resPath)

  for (const directory of directories) {
    if (!directory.startsWith('mipmap')) {
      continue
    }

    const files = await fs.promises.readdir(path.join(resPath, directory))

    for (const file of files) {
      if (file.startsWith(RESOURCE_PREFIX)) {
        await fs.promises.rm(path.join(resPath, directory, file), {force: true})
      }
    }
  }
}

const writeDensity = async (
  projectRoot: string,
  resPath: string,
  icon: AndroidIcon,
  [density, scale]: [string, number]
) => {
  const directory = path.join(resPath, `mipmap-${density}`)
  const {backgroundImage, foregroundImage, monochromeImage} = icon.android
  const adaptiveSize = ADAPTIVE_SIZE * scale
  const legacySize = LEGACY_SIZE * scale
  const files: [string, Buffer][] = [
    [resourceName(icon), await generateLegacyIcon(projectRoot, icon, {isRound: false, size: legacySize})],
    [resourceName(icon, '_round'), await generateLegacyIcon(projectRoot, icon, {isRound: true, size: legacySize})],
    [
      resourceName(icon, '_foreground'),
      await generateLayer(projectRoot, {
        backgroundColor: 'transparent',
        cacheKey: `${icon.name}-foreground`,
        size: adaptiveSize,
        src: foregroundImage,
      }),
    ],
  ]

  if (backgroundImage !== null) {
    files.push([
      resourceName(icon, '_background'),
      await generateLayer(projectRoot, {
        backgroundColor: 'transparent',
        cacheKey: `${icon.name}-background`,
        size: adaptiveSize,
        src: backgroundImage,
      }),
    ])
  }

  if (monochromeImage !== null) {
    files.push([
      resourceName(icon, '_monochrome'),
      await generateLayer(projectRoot, {
        backgroundColor: 'transparent',
        cacheKey: `${icon.name}-monochrome`,
        size: adaptiveSize,
        src: monochromeImage,
      }),
    ])
  }

  await fs.promises.mkdir(directory, {recursive: true})

  for (const [name, buffer] of files) {
    await fs.promises.writeFile(path.join(directory, `${name}.png`), buffer)
  }
}

export const writeIconResources = async (projectRoot: string, resPath: string, icon: AndroidIcon) => {
  for (const density of Object.entries(DENSITIES)) {
    await writeDensity(projectRoot, resPath, icon, density)
  }

  const anyDpiDirectory = path.join(resPath, 'mipmap-anydpi-v26')
  const xml = adaptiveIconXml(icon)

  await fs.promises.mkdir(anyDpiDirectory, {recursive: true})
  await fs.promises.writeFile(path.join(anyDpiDirectory, `${resourceName(icon)}.xml`), xml)
  await fs.promises.writeFile(path.join(anyDpiDirectory, `${resourceName(icon, '_round')}.xml`), xml)
}

const isLauncherFilter = (filter: ManifestIntentFilter) =>
  (filter.action ?? []).some(action => action.$['android:name'] === MAIN_ACTION) &&
  (filter.category ?? []).some(category => category.$['android:name'] === LAUNCHER_CATEGORY)

const isAppIconAlias = (alias: ManifestActivityAlias) =>
  (alias['meta-data'] ?? []).some(metaData => metaData.$['android:name'] === ICON_NAME_META_DATA)

const launcherFilter = (): ManifestIntentFilter => ({
  action: [{$: {'android:name': MAIN_ACTION}}],
  category: [{$: {'android:name': LAUNCHER_CATEGORY}}],
})

const createAlias = (
  mainActivity: ManifestActivity,
  name: string,
  attributes: Record<string, string>
): ManifestActivityAlias => {
  const alias: ManifestActivityAlias & {
    $: NonNullable<ManifestActivityAlias['$']> & Record<string, string | undefined>
  } = {
    $: {
      'android:enabled': name === DEFAULT_ICON ? 'true' : 'false',
      'android:exported': 'true',
      'android:name': `.AppIcon_${name}`,
      'android:targetActivity': mainActivity.$['android:name'],
    },
    'intent-filter': [launcherFilter()],
    'meta-data': [{$: {'android:name': ICON_NAME_META_DATA, 'android:value': name}}],
  }

  if (mainActivity.$['android:label'] !== undefined) {
    alias.$['android:label'] = mainActivity.$['android:label']
  }

  for (const [key, value] of Object.entries(attributes)) {
    alias.$[key] = value
  }

  return alias
}

export const setLauncherAliases = (manifest: AndroidManifest, icons: AndroidIcon[]) => {
  const application = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest)
  const mainActivity = AndroidConfig.Manifest.getMainActivityOrThrow(manifest)
  const intentFilters = mainActivity['intent-filter'] ?? []
  const aliases = (application['activity-alias'] ?? []).filter(alias => !isAppIconAlias(alias))

  if (icons.length === 0) {
    if (!intentFilters.some(isLauncherFilter)) {
      intentFilters.unshift(launcherFilter())
    }

    mainActivity['intent-filter'] = intentFilters
    application['activity-alias'] = aliases
    return manifest
  }

  mainActivity['intent-filter'] = intentFilters.filter(filter => !isLauncherFilter(filter))
  aliases.push(createAlias(mainActivity, DEFAULT_ICON, {}))

  for (const icon of icons) {
    aliases.push(
      createAlias(mainActivity, icon.name, {
        'android:icon': `@mipmap/${resourceName(icon)}`,
        'android:roundIcon': `@mipmap/${resourceName(icon, '_round')}`,
      })
    )
  }

  application['activity-alias'] = aliases
  return manifest
}

export const setBackgroundColors = (colors: ResourceXML, icons: AndroidIcon[]) => {
  if (colors.resources?.color) {
    colors.resources.color = colors.resources.color.filter(color => !color.$.name.startsWith(RESOURCE_PREFIX))
  }

  for (const icon of icons) {
    if (icon.android.backgroundImage === null) {
      AndroidConfig.Colors.assignColorValue(colors, {
        name: resourceName(icon, '_background'),
        value: icon.android.backgroundColor,
      })
    }
  }

  return colors
}

export const syncAndroidResources = async (projectRoot: string, resPath: string, icons: AndroidIcon[]) => {
  await fs.promises.mkdir(resPath, {recursive: true})
  await removeStaleResources(resPath)
  for (const icon of icons) {
    await writeIconResources(projectRoot, resPath, icon)
  }
}

export const withAndroidAppIcons: ConfigPlugin<NormalizedIcon[]> = (config, icons) => {
  const androidIcons = icons.filter((icon): icon is AndroidIcon => icon.android !== null)

  config = withDangerousMod(config, [
    'android',
    async config => {
      const {platformProjectRoot, projectRoot} = config.modRequest
      const resPath = path.join(platformProjectRoot, 'app', 'src', 'main', 'res')

      await syncAndroidResources(projectRoot, resPath, androidIcons)

      return config
    },
  ])

  config = withAndroidColors(config, config => {
    config.modResults = setBackgroundColors(config.modResults, androidIcons)
    return config
  })

  return withAndroidManifest(config, config => {
    config.modResults = setLauncherAliases(config.modResults, androidIcons)
    return config
  })
}
