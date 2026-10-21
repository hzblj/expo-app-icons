import fs from 'node:fs'
import path from 'node:path'

import type {NormalizedAndroidIcon, NormalizedIcon} from './types'

export const DEFAULT_ICON = 'default'
const ICON_NAME_PATTERN = /^[a-z][a-z0-9_]*$/
const RESERVED_SUFFIXES = ['_background', '_foreground', '_monochrome', '_round']
const HEX_COLOR_PATTERN = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/

const fail = (message: string): never => {
  throw new Error(`expo-app-icons: ${message}`)
}

const record = (value: unknown, label: string): Record<string, unknown> => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return fail(`${label} must be an object`)
  }
  return Object.fromEntries(Object.entries(value))
}

const imagePath = (value: unknown, label: string): string => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return fail(`${label} must be a non-empty image path`)
  }
  return value
}

const optionalImagePath = (value: unknown, label: string): string | null =>
  value === undefined ? null : imagePath(value, label)

const normalizeIos = (name: string, value: unknown): NormalizedIcon['ios'] => {
  if (value === undefined) {
    return null
  }
  if (typeof value === 'string' && path.extname(value) === '.icon') {
    return {kind: 'composer', path: value}
  }
  const variants = typeof value === 'string' ? {light: value} : record(value, `icons.${name}.ios`)
  return {
    dark: optionalImagePath(variants.dark, `icons.${name}.ios.dark`),
    kind: 'images',
    light: imagePath(variants.light, `icons.${name}.ios.light`),
    tinted: optionalImagePath(variants.tinted, `icons.${name}.ios.tinted`),
  }
}

const normalizeScale = (name: string, field: string, value: unknown): number => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || value > 1) {
    return fail(`icons.${name}.android.${field} must be a number greater than 0 and at most 1`)
  }
  return value
}

const normalizeOffset = (name: string, field: string, value: unknown): number => {
  if (typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) > 108) {
    return fail(`icons.${name}.android.${field} must be a finite number between -108 and 108 dp`)
  }
  return value
}

const normalizeAndroid = (name: string, value: unknown): NormalizedAndroidIcon | null => {
  if (value === undefined) {
    return null
  }
  const android = record(value, `icons.${name}.android`)
  const backgroundColor = android.backgroundColor ?? '#FFFFFF'
  if (typeof backgroundColor !== 'string' || !HEX_COLOR_PATTERN.test(backgroundColor)) {
    return fail(`icons.${name}.android.backgroundColor must be a #RRGGBB or #AARRGGBB color`)
  }
  const foregroundScale = normalizeScale(name, 'foregroundScale', android.foregroundScale ?? 1)
  return {
    backgroundColor,
    backgroundImage: optionalImagePath(android.backgroundImage, `icons.${name}.android.backgroundImage`),
    foregroundImage: imagePath(android.foregroundImage, `icons.${name}.android.foregroundImage`),
    foregroundOffsetX: normalizeOffset(name, 'foregroundOffsetX', android.foregroundOffsetX ?? 0),
    foregroundOffsetY: normalizeOffset(name, 'foregroundOffsetY', android.foregroundOffsetY ?? 0),
    foregroundScale,
    monochromeImage: optionalImagePath(android.monochromeImage, `icons.${name}.android.monochromeImage`),
    monochromeScale: normalizeScale(name, 'monochromeScale', android.monochromeScale ?? foregroundScale),
  }
}

const validateName = (name: string) => {
  if (!ICON_NAME_PATTERN.test(name)) {
    fail(`"${name}" is not a valid icon name: use lowercase letters, digits and underscores, starting with a letter`)
  }
  if (name === DEFAULT_ICON) {
    fail(`"${name}" is the primary icon and cannot be redefined`)
  }
  if (RESERVED_SUFFIXES.some(suffix => name.endsWith(suffix))) {
    fail(`"${name}" cannot end with ${RESERVED_SUFFIXES.join(', ')}: Android derives its layer resources that way`)
  }
}

export const normalizeIcons = (icons: unknown): NormalizedIcon[] =>
  Object.entries(record(icons ?? {}, 'icons')).map(([name, value]) => {
    validateName(name)
    const icon = record(value, `icons.${name}`)
    const normalized = {android: normalizeAndroid(name, icon.android), ios: normalizeIos(name, icon.ios), name}
    if (normalized.android === null && normalized.ios === null) {
      fail(`icons.${name} defines neither "ios" nor "android"`)
    }
    return normalized
  })

export const resolveImage = (projectRoot: string, image: string): string => {
  const resolved = path.resolve(projectRoot, image)
  if (!fs.existsSync(resolved)) {
    fail(`image "${image}" does not exist (resolved to ${resolved})`)
  }
  return resolved
}
