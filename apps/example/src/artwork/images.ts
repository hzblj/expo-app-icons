import type {ImageSourcePropType} from 'react-native'

/**
 * Every PNG the app config names, by the path it names it with, so a preview shows the very file the plugin was
 * given. Metro bundles only what a `require` spells out, hence the list.
 */
export const IMAGES: Record<string, ImageSourcePropType> = {
  './assets/app-icons/clover/foreground.png': require('../../assets/app-icons/clover/foreground.png'),
  './assets/app-icons/clover/monochrome.png': require('../../assets/app-icons/clover/monochrome.png'),
  './assets/app-icons/midnight/background.png': require('../../assets/app-icons/midnight/background.png'),
  './assets/app-icons/midnight/dark.png': require('../../assets/app-icons/midnight/dark.png'),
  './assets/app-icons/midnight/foreground.png': require('../../assets/app-icons/midnight/foreground.png'),
  './assets/app-icons/midnight/light.png': require('../../assets/app-icons/midnight/light.png'),
  './assets/app-icons/midnight/monochrome.png': require('../../assets/app-icons/midnight/monochrome.png'),
  './assets/app-icons/midnight/tinted.png': require('../../assets/app-icons/midnight/tinted.png'),
  './assets/app-icons/mint/background.png': require('../../assets/app-icons/mint/background.png'),
  './assets/app-icons/mint/dark.png': require('../../assets/app-icons/mint/dark.png'),
  './assets/app-icons/mint/foreground.png': require('../../assets/app-icons/mint/foreground.png'),
  './assets/app-icons/mint/light.png': require('../../assets/app-icons/mint/light.png'),
  './assets/app-icons/mint/monochrome.png': require('../../assets/app-icons/mint/monochrome.png'),
  './assets/app-icons/mint/tinted.png': require('../../assets/app-icons/mint/tinted.png'),
  './assets/app-icons/mono/background.png': require('../../assets/app-icons/mono/background.png'),
  './assets/app-icons/mono/dark.png': require('../../assets/app-icons/mono/dark.png'),
  './assets/app-icons/mono/foreground.png': require('../../assets/app-icons/mono/foreground.png'),
  './assets/app-icons/mono/light.png': require('../../assets/app-icons/mono/light.png'),
  './assets/app-icons/mono/monochrome.png': require('../../assets/app-icons/mono/monochrome.png'),
  './assets/app-icons/mono/tinted.png': require('../../assets/app-icons/mono/tinted.png'),
  './assets/app-icons/sunrise/background.png': require('../../assets/app-icons/sunrise/background.png'),
  './assets/app-icons/sunrise/dark.png': require('../../assets/app-icons/sunrise/dark.png'),
  './assets/app-icons/sunrise/foreground.png': require('../../assets/app-icons/sunrise/foreground.png'),
  './assets/app-icons/sunrise/light.png': require('../../assets/app-icons/sunrise/light.png'),
  './assets/app-icons/sunrise/monochrome.png': require('../../assets/app-icons/sunrise/monochrome.png'),
  './assets/app-icons/sunrise/tinted.png': require('../../assets/app-icons/sunrise/tinted.png'),
}

export type Appearances = {dark: ImageSourcePropType; light: ImageSourcePropType; tinted: ImageSourcePropType}

/** What iOS renders itself from an Icon Composer document, as Icon Composer previews it. */
export const COMPOSER_PREVIEWS: Record<string, Appearances> = {
  './assets/app-icons/glass.icon': {
    dark: require('../../assets/app-icons/glass/dark.png'),
    light: require('../../assets/app-icons/glass/light.png'),
    tinted: require('../../assets/app-icons/glass/tinted.png'),
  },
}

/** The gradient iOS puts behind a dark icon's transparent background. */
export const DARK_BACKDROP: ImageSourcePropType = require('../../assets/app-icons/dark-backdrop.png')
