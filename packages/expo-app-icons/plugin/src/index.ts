import {type ConfigPlugin, createRunOncePlugin} from 'expo/config-plugins'

import {normalizeIcons} from './icons'
import type {AppIconsPluginOptions} from './types'
import {withAndroidAppIcons} from './withAndroidAppIcons'
import {withIosAppIcons} from './withIosAppIcons'

export type {AndroidAppIcon, AppIconConfig, AppIconsPluginOptions, IosAppIcon} from './types'

const pkg: {name: string; version: string} = require('../../package.json')

const withAppIcons: ConfigPlugin<AppIconsPluginOptions | void> = (config, options) => {
  const normalizedIcons = normalizeIcons(options?.icons)

  config = withIosAppIcons(config, normalizedIcons)
  return withAndroidAppIcons(config, normalizedIcons)
}

export default createRunOncePlugin(withAppIcons, pkg.name, pkg.version)
