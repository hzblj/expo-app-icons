export type AppIconName = string

export type AppIconChange = 'changed' | 'scheduled' | 'unchanged' | 'unsupported'

export type AppIconChangeListener = (icon: AppIconName) => void

export type AppIconSubscription = {
  remove: () => void
}

export type AppIconModule = {
  addChangeListener: (listener: AppIconChangeListener) => AppIconSubscription
  getAvailableIcons: () => AppIconName[]
  getIcon: () => Promise<AppIconName>
  isSupported: () => boolean
  resetIcon: () => Promise<AppIconChange>
  setIcon: (name: AppIconName) => Promise<AppIconChange>
}
