import {NativeModule, requireOptionalNativeModule} from 'expo'

import type {AppIconChange} from './types'

declare class ExpoAppIconsNativeModule extends NativeModule {
  getAlternateIcons(): string[]
  getIcon(): Promise<string>
  isSupported(): boolean
  setIcon(name: string): Promise<Exclude<AppIconChange, 'unsupported'>>
}

export const ExpoAppIcons = requireOptionalNativeModule<ExpoAppIconsNativeModule>('ExpoAppIcons')
