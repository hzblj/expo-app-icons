import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {cp, mkdir, mkdtemp, readdir, readFile, rm, writeFile} from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {after, test} from 'node:test'
import Jimp from 'jimp-compact'
import {project as createProject} from 'xcode'

import {normalizeIcons} from '../src/icons'
import type {AndroidIcon, ComposerIcon, IosIcon, NormalizedIcon} from '../src/types'
import {syncAndroidResources} from '../src/withAndroidAppIcons'
import {setAlternateIconNames, syncIconComposerFiles, syncIosResources} from '../src/withIosAppIcons'

const roots: string[] = []
after(async () => {
  await Promise.all(roots.map(root => rm(root, {force: true, recursive: true})))
})
const fixture = async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'app-icon-generation-'))
  roots.push(root)
  await new Jimp(108, 108, '#00ff00').writeAsync(path.join(root, 'source.png'))
  await mkdir(path.join(root, 'source.icon', 'Assets'), {recursive: true})
  await writeFile(path.join(root, 'source.icon', 'icon.json'), '{}')
  await writeFile(path.join(root, 'source.icon', 'Assets', 'logo.svg'), '<svg/>')
  return root
}
const snapshot = async (directory: string): Promise<Record<string, string>> => {
  const files = await readdir(directory, {recursive: true, withFileTypes: true})
  const entries = await Promise.all(
    files
      .filter(file => file.isFile())
      .map(async file => {
        const absolute = path.join(file.parentPath, file.name)
        const hash = createHash('sha256')
          .update(await readFile(absolute))
          .digest('hex')
        return [path.relative(directory, absolute), hash]
      })
  )
  return Object.fromEntries(entries)
}
const android = (icons: NormalizedIcon[]) => icons.filter((icon): icon is AndroidIcon => icon.android !== null)
const ios = (icons: NormalizedIcon[]) => icons.filter((icon): icon is IosIcon => icon.ios !== null)
const composer = (icons: NormalizedIcon[]) =>
  icons.filter((icon): icon is ComposerIcon => icon.ios?.kind === 'composer')

test('Android resource synchronization is byte-identical on repeat and cleans renamed or removed icons', async () => {
  const root = await fixture()
  const res = path.join(root, 'res')
  const icons = android(normalizeIcons({campaign: {android: {foregroundImage: 'source.png', foregroundScale: 0.75}}}))
  await syncAndroidResources(root, res, icons)
  const first = await snapshot(res)
  await syncAndroidResources(root, res, icons)
  assert.deepEqual(await snapshot(res), first)
  const renamed = android(normalizeIcons({renamed: {android: {foregroundImage: 'source.png'}}}))
  await syncAndroidResources(root, res, renamed)
  assert.ok(Object.keys(await snapshot(res)).every(file => !file.includes('campaign')))
  await syncAndroidResources(root, res, [])
  assert.deepEqual(await snapshot(res), {})
})

test('iOS resources regenerate without duplicates, clean changed formats and preserve unrelated assets', async () => {
  const root = await fixture()
  const destination = path.join(root, 'ios', 'Fixture')
  await mkdir(path.join(destination, 'Images.xcassets', 'Other.appiconset'), {recursive: true})
  await writeFile(path.join(destination, 'Images.xcassets', 'Other.appiconset', 'keep.txt'), 'keep')
  const icons = ios(
    normalizeIcons({campaign: {ios: 'source.icon'}, png: {ios: {dark: 'source.png', light: 'source.png'}}})
  )
  await syncIosResources(root, destination, icons)
  const first = await snapshot(destination)
  await syncIosResources(root, destination, icons)
  assert.deepEqual(await snapshot(destination), first)
  await syncIosResources(root, destination, ios(normalizeIcons({campaign: {ios: 'source.png'}})))
  const changed = Object.keys(await snapshot(destination))
  assert.ok(changed.some(file => file.includes('AppIcon-campaign.appiconset')))
  assert.ok(changed.every(file => !file.includes('AppIcon-campaign.icon') && !file.includes('AppIcon-png')))
  await syncIosResources(root, destination, [])
  assert.deepEqual(Object.keys(await snapshot(destination)), ['Images.xcassets/Other.appiconset/keep.txt'])
})

test('Xcode synchronization preserves references on repeat and removes retired build and group entries', async () => {
  const root = await fixture()
  const projectFile = path.join(root, 'project.pbxproj')
  await cp(path.join(__dirname, 'fixtures', 'project.pbxproj'), projectFile)
  const project = createProject(projectFile)
  project.parseSync()
  const icons = composer(normalizeIcons({campaign: {ios: 'source.icon'}}))
  syncIconComposerFiles(project, 'Fixture', icons)
  setAlternateIconNames(project, 'Fixture', ['AppIcon-campaign'])
  const first = project.writeSync()
  syncIconComposerFiles(project, 'Fixture', icons)
  setAlternateIconNames(project, 'Fixture', ['AppIcon-campaign'])
  assert.equal(project.writeSync(), first)
  const duplicate = 'B00000000000000000000001'
  const references = project.pbxFileReferenceSection()
  const reference = Object.values(references).find(
    value =>
      typeof value === 'object' && value !== null && 'path' in value && String(value.path).includes('AppIcon-campaign')
  )
  references[duplicate] = structuredClone(reference)
  syncIconComposerFiles(project, 'Fixture', icons)
  assert.equal(project.writeSync(), first)
  const renamed = composer(normalizeIcons({renamed: {ios: 'source.icon'}}))
  syncIconComposerFiles(project, 'Fixture', renamed)
  setAlternateIconNames(project, 'Fixture', ['AppIcon-renamed'])
  assert.doesNotMatch(project.writeSync(), /AppIcon-campaign/)
  syncIconComposerFiles(project, 'Fixture', [])
  setAlternateIconNames(project, 'Fixture', [])
  assert.doesNotMatch(project.writeSync(), /AppIcon-renamed|ASSETCATALOG_COMPILER_ALTERNATE_APPICON_NAMES/)
  assert.match(project.writeSync(), /Keep.txt in Resources/)
})
