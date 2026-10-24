import {DEFAULT_APP_ICON} from '@hzblj/expo-app-icons'
import type {AppIconConfig, AppIconsPluginOptions} from '@hzblj/expo-app-icons/plugin'
import Constants from 'expo-constants'

const PLUGIN = '@hzblj/expo-app-icons'

const expoConfig = Constants.expoConfig

const readPluginOptions = (): AppIconsPluginOptions => {
  const entry = expoConfig?.plugins?.find(plugin => Array.isArray(plugin) && plugin[0] === PLUGIN)

  return Array.isArray(entry) && entry.length === 2 ? entry[1] : {}
}

/**
 * The plugin's options as app.config.ts passes them, read from the config this build runs on: what the screens show
 * is what the plugin was given.
 */
export const PLUGIN_OPTIONS = readPluginOptions()

const readPrimaryIcon = (): AppIconConfig => {
  const {adaptiveIcon} = expoConfig?.android ?? {}
  const ios = expoConfig?.ios?.icon ?? expoConfig?.icon

  return {
    android: adaptiveIcon?.foregroundImage
      ? {
          backgroundColor: adaptiveIcon.backgroundColor,
          backgroundImage: adaptiveIcon.backgroundImage,
          foregroundImage: adaptiveIcon.foregroundImage,
          monochromeImage: adaptiveIcon.monochromeImage,
        }
      : undefined,
    ios: typeof ios === 'object' ? {dark: ios.dark, light: ios.light ?? '', tinted: ios.tinted} : ios,
  }
}

/** The primary icon, on Expo's own keys (`ios.icon`, `android.adaptiveIcon`), in the plugin's shape. */
export const PRIMARY_ICON = readPrimaryIcon()

/** The same, as the app config writes it: the keys it names alone, not the URLs a development server adds. */
export const PRIMARY_ICON_KEYS = {
  android: {adaptiveIcon: PRIMARY_ICON.android},
  ios: {icon: PRIMARY_ICON.ios},
}

/** An icon's configuration by the name the API knows it by: `default` is the primary one. */
export const configOf = (name: string): AppIconConfig | undefined =>
  name === DEFAULT_APP_ICON ? PRIMARY_ICON : PLUGIN_OPTIONS.icons?.[name]

/** Every icon the config names, primary first, then the alternates by name: the order `getAvailableIcons()` keeps. */
export const CONFIGURED_ICONS = [DEFAULT_APP_ICON, ...Object.keys(PLUGIN_OPTIONS.icons ?? {}).sort()]
