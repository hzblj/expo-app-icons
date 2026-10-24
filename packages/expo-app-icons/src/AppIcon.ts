import {ExpoAppIcons} from './ExpoAppIconsModule'
import type {AppIconChange, AppIconChangeListener, AppIconModule, AppIconName, AppIconSubscription} from './types'

export const DEFAULT_APP_ICON: AppIconName = 'default'

const listeners = new Set<AppIconChangeListener>()

let availableIcons: AppIconName[] | null = null

const isSupported = () => ExpoAppIcons !== null && ExpoAppIcons.isSupported()

const getAvailableIcons = (): AppIconName[] => {
  if (availableIcons !== null) {
    return availableIcons
  }

  availableIcons =
    ExpoAppIcons !== null && ExpoAppIcons.isSupported()
      ? [DEFAULT_APP_ICON].concat(ExpoAppIcons.getAlternateIcons())
      : [DEFAULT_APP_ICON]

  return availableIcons
}

const getIcon = async (): Promise<AppIconName> => {
  if (ExpoAppIcons === null || !ExpoAppIcons.isSupported()) {
    return DEFAULT_APP_ICON
  }

  return ExpoAppIcons.getIcon()
}

const setIcon = async (name: AppIconName): Promise<AppIconChange> => {
  if (ExpoAppIcons === null || !ExpoAppIcons.isSupported()) {
    return 'unsupported'
  }

  const change = await ExpoAppIcons.setIcon(name)

  if (change !== 'unchanged') {
    for (const listener of listeners) {
      listener(name)
    }
  }

  return change
}

const resetIcon = () => setIcon(DEFAULT_APP_ICON)

const addChangeListener = (listener: AppIconChangeListener): AppIconSubscription => {
  listeners.add(listener)

  return {
    remove: () => {
      listeners.delete(listener)
    },
  }
}

export const AppIcon = {
  addChangeListener,
  getAvailableIcons,
  getIcon,
  isSupported,
  resetIcon,
  setIcon,
} satisfies AppIconModule
