import fs from 'node:fs'
import path from 'node:path'
import {generateImageAsync} from '@expo/image-utils'
import {type ConfigPlugin, IOSConfig, withDangerousMod, withXcodeProject, type XcodeProject} from 'expo/config-plugins'

import {resolveImage} from './icons'
import type {ComposerIcon, ImageIcon, IosIcon, NormalizedIcon} from './types'

const ICON_NAME_PREFIX = 'AppIcon-'
const ICON_SET_EXTENSION = '.appiconset'
const ICON_COMPOSER_EXTENSION = '.icon'
const ICON_COMPOSER_FILE_TYPE = 'folder.iconcomposer.icon'
const ICON_SIZE = 1024
const ALTERNATE_ICON_NAMES_SETTING = 'ASSETCATALOG_COMPILER_ALTERNATE_APPICON_NAMES'
const APPEARANCES: {appearance: 'dark' | 'tinted' | null; variant: 'light' | 'dark' | 'tinted'}[] = [
  {appearance: null, variant: 'light'},
  {appearance: 'dark', variant: 'dark'},
  {appearance: 'tinted', variant: 'tinted'},
]

const iconName = (icon: NormalizedIcon) => `${ICON_NAME_PREFIX}${icon.name}`

const iconComposerFileName = (icon: NormalizedIcon) => `${iconName(icon)}${ICON_COMPOSER_EXTENSION}`

const isOwnIconEntry = (entry: string, extension: string) =>
  entry.startsWith(ICON_NAME_PREFIX) && entry.endsWith(extension)

const unquote = (value: unknown): string => (typeof value === 'string' ? value.replace(/^"(.*)"$/, '$1') : '')

const imageFileName = (appearance: 'dark' | 'tinted' | null) =>
  appearance === null
    ? `App-Icon-${ICON_SIZE}x${ICON_SIZE}@1x.png`
    : `App-Icon-${appearance}-${ICON_SIZE}x${ICON_SIZE}@1x.png`

const removeOwnEntries = async (directory: string, extension: string) => {
  const entries = await fs.promises.readdir(directory)

  for (const entry of entries) {
    if (isOwnIconEntry(entry, extension)) {
      await fs.promises.rm(path.join(directory, entry), {force: true, recursive: true})
    }
  }
}

const writeIconSet = async (projectRoot: string, catalogPath: string, icon: ImageIcon) => {
  const iconSetPath = path.join(catalogPath, `${iconName(icon)}${ICON_SET_EXTENSION}`)
  const images = []

  await fs.promises.mkdir(iconSetPath, {recursive: true})

  for (const {appearance, variant} of APPEARANCES) {
    const source = icon.ios[variant]

    if (source === null) {
      continue
    }

    const filename = imageFileName(appearance)
    const isDark = appearance === 'dark'
    const {source: buffer} = await generateImageAsync(
      {cacheType: `expo-app-icons-ios-${icon.name}-${variant}`, projectRoot},
      {
        backgroundColor: isDark ? undefined : '#ffffff',
        height: ICON_SIZE,
        name: filename,
        removeTransparency: !isDark,
        resizeMode: 'cover',
        src: resolveImage(projectRoot, source),
        width: ICON_SIZE,
      }
    )

    await fs.promises.writeFile(path.join(iconSetPath, filename), buffer)

    const image: {
      filename: string
      idiom: string
      platform: string
      size: string
      appearances?: {appearance: string; value: string}[]
    } = {filename, idiom: 'universal', platform: 'ios', size: `${ICON_SIZE}x${ICON_SIZE}`}

    if (appearance !== null) {
      image.appearances = [{appearance: 'luminosity', value: appearance}]
    }

    images.push(image)
  }

  await fs.promises.writeFile(
    path.join(iconSetPath, 'Contents.json'),
    `${JSON.stringify({images, info: {author: 'expo', version: 1}}, null, 2)}\n`
  )
}

const copyIconComposerFile = async (projectRoot: string, projectPath: string, icon: ComposerIcon) => {
  await fs.promises.cp(resolveImage(projectRoot, icon.ios.path), path.join(projectPath, iconComposerFileName(icon)), {
    filter: source => path.basename(source) !== '.DS_Store',
    recursive: true,
  })
}

export const setAlternateIconNames = (project: XcodeProject, projectName: string, names: string[]) => {
  const [, target] = IOSConfig.Target.findNativeTargetByName(project, projectName)
  const configurations = IOSConfig.XcodeUtils.getBuildConfigurationsForListId(project, target.buildConfigurationList)

  for (const [, configuration] of configurations) {
    if (!configuration.buildSettings) {
      continue
    }

    if (names.length === 0) {
      delete configuration.buildSettings[ALTERNATE_ICON_NAMES_SETTING]
      continue
    }

    configuration.buildSettings[ALTERNATE_ICON_NAMES_SETTING] = `"${names.join(' ')}"`
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

const referenceValue = (value: unknown): string =>
  isRecord(value) && typeof value.value === 'string' ? value.value : ''

const removeFileReference = (project: XcodeProject, fileRefUuid: string) => {
  const objects = project.hash.project.objects
  const buildFiles = objects.PBXBuildFile ?? {}
  const buildFileUuids = Object.keys(buildFiles).filter(uuid => buildFiles[uuid]?.fileRef === fileRefUuid)

  for (const uuid of buildFileUuids) {
    delete buildFiles[uuid]
    delete buildFiles[`${uuid}_comment`]
  }

  for (const phase of Object.values(objects.PBXResourcesBuildPhase ?? {})) {
    if (isRecord(phase) && Array.isArray(phase.files)) {
      phase.files = phase.files.filter((file: unknown) => !buildFileUuids.includes(referenceValue(file)))
    }
  }

  for (const group of Object.values(objects.PBXGroup ?? {})) {
    if (isRecord(group) && Array.isArray(group.children)) {
      group.children = group.children.filter((child: unknown) => referenceValue(child) !== fileRefUuid)
    }
  }

  delete objects.PBXFileReference[fileRefUuid]
  delete objects.PBXFileReference[`${fileRefUuid}_comment`]
}

export const syncIconComposerFiles = (project: XcodeProject, projectName: string, icons: ComposerIcon[]) => {
  const fileNames = icons.map(iconComposerFileName)
  const fileReferences = project.pbxFileReferenceSection()
  const retainedNames = new Set<string>()

  for (const [uuid, reference] of Object.entries(fileReferences)) {
    const fileName = path.basename(unquote(isRecord(reference) ? reference.path : ''))

    if (!isOwnIconEntry(fileName, ICON_COMPOSER_EXTENSION)) {
      continue
    }
    if (!fileNames.includes(fileName) || retainedNames.has(fileName)) {
      removeFileReference(project, uuid)
      continue
    }
    retainedNames.add(fileName)
  }

  for (const fileName of fileNames) {
    IOSConfig.XcodeUtils.addResourceFileToGroup({
      filepath: `${projectName}/${fileName}`,
      groupName: projectName,
      isBuildFile: true,
      project,
    })
  }

  for (const reference of Object.values(project.pbxFileReferenceSection())) {
    if (isRecord(reference) && fileNames.includes(path.basename(unquote(reference.path)))) {
      reference.lastKnownFileType = ICON_COMPOSER_FILE_TYPE
    }
  }
}

export const syncIosResources = async (projectRoot: string, projectPath: string, icons: IosIcon[]) => {
  const catalogPath = path.join(projectPath, 'Images.xcassets')
  await fs.promises.mkdir(catalogPath, {recursive: true})
  await removeOwnEntries(catalogPath, ICON_SET_EXTENSION)
  await removeOwnEntries(projectPath, ICON_COMPOSER_EXTENSION)
  for (const icon of icons) {
    if (icon.ios.kind === 'composer') {
      await copyIconComposerFile(projectRoot, projectPath, {...icon, ios: icon.ios})
    } else {
      await writeIconSet(projectRoot, catalogPath, {...icon, ios: icon.ios})
    }
  }
}

export const withIosAppIcons: ConfigPlugin<NormalizedIcon[]> = (config, icons) => {
  const iosIcons = icons.filter((icon): icon is IosIcon => icon.ios !== null)
  const composerIcons = iosIcons.filter((icon): icon is ComposerIcon => icon.ios.kind === 'composer')

  config = withDangerousMod(config, [
    'ios',
    async config => {
      const {platformProjectRoot, projectName, projectRoot} = config.modRequest
      if (!projectName) {
        throw new Error('expo-app-icons: missing iOS project name')
      }
      const projectPath = path.join(platformProjectRoot, projectName)
      await syncIosResources(projectRoot, projectPath, iosIcons)

      return config
    },
  ])

  return withXcodeProject(config, config => {
    const {projectName} = config.modRequest
    if (!projectName) {
      throw new Error('expo-app-icons: missing iOS project name')
    }

    setAlternateIconNames(config.modResults, projectName, iosIcons.map(iconName))
    syncIconComposerFiles(config.modResults, projectName, composerIcons)
    return config
  })
}
