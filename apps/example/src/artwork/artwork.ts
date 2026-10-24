import type {ImageSourcePropType} from 'react-native'

import {configOf} from './config'
import {type Appearances, COMPOSER_PREVIEWS, IMAGES} from './images'

/** The Android canvas in dp, and the middle of it a launcher shows through its mask. */
export const ANDROID_CANVAS = 108
export const ANDROID_VISIBLE = 72
/** The circle that survives every launcher's mask. */
export const ANDROID_SAFE_ZONE = 66

export type IosArtwork = {
  appearances: Appearances
  /** An Icon Composer document: iOS renders it, and its previews come masked and lit already. */
  composer: boolean
  /** The dark appearance has its own PNG, with no background of its own: iOS puts a dark backdrop behind it. */
  transparentDark: boolean
}

/** An icon's iOS appearances, from the files its config names. `null` when it does not ship on iOS. */
export const iosArtworkOf = (name: string): IosArtwork | null => {
  const ios = configOf(name)?.ios

  if (ios === undefined) {
    return null
  }

  if (typeof ios === 'string') {
    const composer = COMPOSER_PREVIEWS[ios]
    const image = IMAGES[ios]

    if (composer) {
      return {appearances: composer, composer: true, transparentDark: false}
    }

    return image
      ? {appearances: {dark: image, light: image, tinted: image}, composer: false, transparentDark: false}
      : null
  }

  const light = IMAGES[ios.light]
  const dark = ios.dark ? IMAGES[ios.dark] : undefined
  const tinted = ios.tinted ? IMAGES[ios.tinted] : undefined

  return light
    ? {appearances: {dark: dark ?? light, light, tinted: tinted ?? light}, composer: false, transparentDark: !!dark}
    : null
}

export type AndroidArtwork = {
  background: ImageSourcePropType | null
  /** What shows where there is no background image. */
  backgroundColor: string
  foreground: ImageSourcePropType
  monochrome: ImageSourcePropType | null
  monochromeScale: number
  /** dp on the 108 dp canvas. */
  offsetX: number
  offsetY: number
  scale: number
}

/** An icon's adaptive layers and their transform, with the plugin's defaults. `null` when it does not ship on Android. */
export const androidArtworkOf = (name: string): AndroidArtwork | null => {
  const android = configOf(name)?.android
  const foreground = android ? IMAGES[android.foregroundImage] : undefined

  if (!android || !foreground) {
    return null
  }

  const scale = android.foregroundScale ?? 1

  return {
    background: android.backgroundImage ? (IMAGES[android.backgroundImage] ?? null) : null,
    backgroundColor: android.backgroundColor ?? '#FFFFFF',
    foreground,
    monochrome: android.monochromeImage ? (IMAGES[android.monochromeImage] ?? null) : null,
    monochromeScale: android.monochromeScale ?? scale,
    offsetX: android.foregroundOffsetX ?? 0,
    offsetY: android.foregroundOffsetY ?? 0,
    scale,
  }
}
