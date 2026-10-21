import assert from 'node:assert/strict'
import {mkdir, mkdtemp, readFile, rm, writeFile} from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {after, test} from 'node:test'
import type {AndroidConfig} from 'expo/config-plugins'
import Jimp from 'jimp-compact'

import {normalizeIcons} from '../src/icons'
import type {AndroidIcon} from '../src/types'
import {
  adaptiveIconXml,
  generateLegacyIcon,
  removeStaleResources,
  setBackgroundColors,
  setLauncherAliases,
  writeIconResources,
} from '../src/withAndroidAppIcons'

type AndroidManifest = AndroidConfig.Manifest.AndroidManifest
type ManifestApplication = AndroidConfig.Manifest.ManifestApplication
type ManifestIntentFilter = AndroidConfig.Manifest.ManifestIntentFilter

const normalize = (android: Record<string, unknown>): AndroidIcon => {
  const icon = normalizeIcons({campaign: {android: {foregroundImage: 'foreground.png', ...android}}})[0]
  assert.ok(icon?.android)
  return {...icon, android: icon.android}
}

const fixtureRoots: string[] = []

after(async () => {
  await Promise.all(fixtureRoots.map(root => rm(root, {force: true, recursive: true})))
})

const withFixture = async (run: (root: string) => Promise<void>) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'app-icon-'))
  fixtureRoots.push(root)
  await new Jimp(108, 108, '#ff0000').writeAsync(path.join(root, 'foreground.png'))
  await run(root)
}

test('transforms default independently for each icon and monochrome inherits scale', () => {
  const icons = normalizeIcons({
    normal: {android: {foregroundImage: 'b.png'}},
    small: {android: {foregroundImage: 'a.png', foregroundScale: 0.75}},
  })
  assert.equal(icons.find(icon => icon.name === 'small')?.android?.monochromeScale, 0.75)
  assert.equal(icons.find(icon => icon.name === 'normal')?.android?.foregroundScale, 1)
  assert.equal(icons.find(icon => icon.name === 'normal')?.android?.foregroundOffsetX, 0)
  assert.equal(normalize({monochromeScale: 0.5}).android.monochromeScale, 0.5)
})

test('rejects invalid transforms and reserved resource names', () => {
  for (const field of ['foregroundScale', 'monochromeScale']) {
    for (const value of [0, -1, 1.01, NaN, Infinity, '0.75']) {
      assert.throws(() => normalize({[field]: value}), new RegExp(field))
    }
  }
  for (const field of ['foregroundOffsetX', 'foregroundOffsetY']) {
    for (const value of [109, -109, NaN, Infinity, '4']) {
      assert.throws(() => normalize({[field]: value}), new RegExp(field))
    }
  }
  for (const name of ['default', 'a_round', 'a_foreground', 'Bad-Name']) {
    assert.throws(() => normalizeIcons({[name]: {android: {foregroundImage: 'a.png'}}}))
  }
})

test('adaptive layers preserve full background and apply independent scale and signed offsets', () => {
  const xml = adaptiveIconXml(
    normalize({
      foregroundOffsetX: 5.4,
      foregroundOffsetY: -5.4,
      foregroundScale: 0.75,
      monochromeImage: 'mono.png',
      monochromeScale: 0.5,
    })
  )
  assert.match(xml, /<background android:drawable="@color\/app_icon_campaign_background"\/>/)
  assert.match(xml, /<foreground>.*insetLeft="17.5%".*insetTop="7.5%".*insetRight="7.5%".*insetBottom="17.5%"/)
  assert.match(xml, /<monochrome>.*insetLeft="30%".*insetTop="20%".*insetRight="20%".*insetBottom="30%"/)
  assert.doesNotMatch(adaptiveIconXml(normalize({})), /inset|monochrome/)
})

test('legacy icons scale and move foreground over a full background and round the final composition', async () => {
  await withFixture(async root => {
    const icon = normalize({backgroundColor: '#0000ff', foregroundOffsetX: 10.8, foregroundScale: 0.5})
    const image = await Jimp.read(await generateLegacyIcon(root, icon, {isRound: false, size: 100}))
    assert.equal(image.bitmap.width, 100)
    assert.equal(image.getPixelColor(34, 50), Jimp.cssColorToHex('#0000ff'))
    assert.equal(image.getPixelColor(35, 50), Jimp.cssColorToHex('#ff0000'))
    assert.equal(image.getPixelColor(84, 50), Jimp.cssColorToHex('#ff0000'))
    assert.equal(image.getPixelColor(85, 50), Jimp.cssColorToHex('#0000ff'))
    const round = await Jimp.read(await generateLegacyIcon(root, icon, {isRound: true, size: 100}))
    assert.equal(Jimp.intToRGBA(round.getPixelColor(0, 0)).a, 0)
    assert.equal(Jimp.intToRGBA(round.getPixelColor(50, 50)).a, 255)
  })
})

test('writes every density, replaces resources, and only removes owned stale icons', async () => {
  await withFixture(async root => {
    const res = path.join(root, 'res')
    await mkdir(path.join(res, 'mipmap-mdpi'), {recursive: true})
    await writeFile(path.join(res, 'mipmap-mdpi', 'app_icon_old.png'), 'old')
    await writeFile(path.join(res, 'mipmap-mdpi', 'ic_launcher.png'), 'keep')
    await removeStaleResources(res)
    await assert.rejects(readFile(path.join(res, 'mipmap-mdpi', 'app_icon_old.png')))
    assert.equal(await readFile(path.join(res, 'mipmap-mdpi', 'ic_launcher.png'), 'utf8'), 'keep')
    const icon = normalize({foregroundScale: 0.75, monochromeImage: 'foreground.png'})
    await writeIconResources(root, res, icon)
    for (const [density, size] of [
      ['mdpi', 108],
      ['hdpi', 162],
      ['xhdpi', 216],
      ['xxhdpi', 324],
      ['xxxhdpi', 432],
    ]) {
      const image = await Jimp.read(path.join(res, `mipmap-${density}`, 'app_icon_campaign_foreground.png'))
      assert.equal(image.bitmap.width, size)
    }
    const xmlPath = path.join(res, 'mipmap-anydpi-v26', 'app_icon_campaign.xml')
    assert.match(await readFile(xmlPath, 'utf8'), /12.5%/)
    await writeIconResources(root, res, normalize({foregroundScale: 0.5}))
    assert.match(await readFile(xmlPath, 'utf8'), /25%/)
  })
})

const launcherFilter = (): ManifestIntentFilter => ({
  action: [{$: {'android:name': 'android.intent.action.MAIN'}}],
  category: [{$: {'android:name': 'android.intent.category.LAUNCHER'}}],
})

test('aliases regenerate idempotently, remove retired icons, and restore the main launcher when disabled', () => {
  const deepLink = {action: [{$: {'android:name': 'android.intent.action.VIEW'}}]}
  const activity = {$: {'android:name': '.MainActivity'}, 'intent-filter': [launcherFilter(), deepLink]}
  const application: ManifestApplication = {$: {'android:name': '.MainApplication'}, activity: [activity]}
  const manifest: AndroidManifest = {
    manifest: {
      $: {'xmlns:android': 'http://schemas.android.com/apk/res/android'},
      application: [application],
      queries: [],
    },
  }
  const icons = [normalize({})]
  setLauncherAliases(manifest, icons)
  setLauncherAliases(manifest, icons)
  assert.equal(application['activity-alias']?.length, 2)
  assert.equal(application['activity-alias']?.[0]?.$?.['android:enabled'], 'true')
  assert.equal(application['activity-alias']?.[1]?.$?.['android:enabled'], 'false')
  assert.equal(application['activity-alias']?.[1]?.$?.['android:targetActivity'], '.MainActivity')
  assert.deepEqual(activity['intent-filter'], [deepLink])
  setLauncherAliases(manifest, [])
  assert.equal(application['activity-alias']?.length, 0)
  assert.equal(activity['intent-filter'].length, 2)
})

test('background color updates replace owned colors without duplication and preserve unrelated values', () => {
  const colors = {
    resources: {
      color: [
        {_: '#123456', $: {name: 'other'}},
        {_: '#ffffff', $: {name: 'app_icon_retired_background'}},
      ],
    },
  }
  const icon = normalize({backgroundColor: '#0000ff'})
  setBackgroundColors(colors, [icon])
  const first = structuredClone(colors)
  setBackgroundColors(colors, [icon])
  assert.deepEqual(colors, first)
  assert.equal(colors.resources.color.length, 2)
  setBackgroundColors(colors, [])
  assert.deepEqual(colors.resources.color, [{_: '#123456', $: {name: 'other'}}])
})
