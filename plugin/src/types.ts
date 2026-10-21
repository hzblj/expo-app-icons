export type AndroidAppIcon = {
  foregroundImage: string
  backgroundImage?: string
  backgroundColor?: string
  foregroundScale?: number
  foregroundOffsetX?: number
  foregroundOffsetY?: number
  monochromeImage?: string
  monochromeScale?: number
}

export type IosAppIcon = string | {light: string; dark?: string; tinted?: string}
export type AppIconConfig = {android?: AndroidAppIcon; ios?: IosAppIcon}
export type AppIconsPluginOptions = {icons?: Record<string, AppIconConfig>}

export type NormalizedAndroidIcon = {
  foregroundImage: string
  backgroundImage: string | null
  backgroundColor: string
  foregroundScale: number
  foregroundOffsetX: number
  foregroundOffsetY: number
  monochromeImage: string | null
  monochromeScale: number
}
export type IosComposerIcon = {kind: 'composer'; path: string}
export type IosImageIcon = {kind: 'images'; light: string; dark: string | null; tinted: string | null}
export type NormalizedIcon = {
  name: string
  android: NormalizedAndroidIcon | null
  ios: IosComposerIcon | IosImageIcon | null
}
export type AndroidIcon = NormalizedIcon & {android: NormalizedAndroidIcon}
export type IosIcon = NormalizedIcon & {ios: IosComposerIcon | IosImageIcon}
export type ComposerIcon = NormalizedIcon & {ios: IosComposerIcon}
export type ImageIcon = NormalizedIcon & {ios: IosImageIcon}
