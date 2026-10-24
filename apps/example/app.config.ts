import type {AppIconsPluginOptions} from '@hzblj/expo-app-icons/plugin'
import type {ExpoConfig} from 'expo/config'

// Not "Expo App Icons": the generated Xcode target would be `ExpoAppIcons`, the Swift module of the package.
const NAME = 'App Icons'
const BUNDLE_ID = 'com.hzblj.expoappicons.example'

/** One of the rendered PNGs in assets/app-icons (`yarn icons:render` draws them from its SVGs). */
const art = (file: string) => `./assets/app-icons/${file}.png`

/**
 * The alternates. The Android layers are the iOS artwork on a 108 dp canvas, which Android shows the middle 72 dp
 * of: at two thirds of it, a motif takes the same share of the icon on both platforms.
 */
const appIcons: AppIconsPluginOptions = {
  icons: {
    // Android only, on a colour instead of a background image.
    clover: {
      android: {
        backgroundColor: '#E9DDFF',
        foregroundImage: art('clover/foreground'),
        foregroundScale: 0.667,
        monochromeImage: art('clover/monochrome'),
      },
    },
    // iOS only: an Icon Composer document, whose Liquid Glass and appearances iOS renders itself.
    glass: {
      ios: './assets/app-icons/glass.icon',
    },
    midnight: {
      android: {
        backgroundImage: art('midnight/background'),
        foregroundImage: art('midnight/foreground'),
        // The crescent's weight sits low and to the left: 3 dp right and up centres it in a round mask.
        foregroundOffsetX: 3,
        foregroundOffsetY: -3,
        foregroundScale: 0.667,
        monochromeImage: art('midnight/monochrome'),
      },
      ios: {
        dark: art('midnight/dark'),
        light: art('midnight/light'),
        tinted: art('midnight/tinted'),
      },
    },
    mint: {
      android: {
        backgroundImage: art('mint/background'),
        foregroundImage: art('mint/foreground'),
        foregroundScale: 0.667,
        monochromeImage: art('mint/monochrome'),
      },
      ios: {
        dark: art('mint/dark'),
        light: art('mint/light'),
        tinted: art('mint/tinted'),
      },
    },
    mono: {
      android: {
        backgroundImage: art('mono/background'),
        foregroundImage: art('mono/foreground'),
        foregroundScale: 0.667,
        monochromeImage: art('mono/monochrome'),
        // A wide switch looks larger on the solid circle of a themed icon: a little smaller there.
        monochromeScale: 0.6,
      },
      ios: {
        dark: art('mono/dark'),
        light: art('mono/light'),
        tinted: art('mono/tinted'),
      },
    },
  },
}

export default {
  android: {
    // The primary icon, Sunrise, stays Expo's own: `default` is reserved for it. `adaptiveIcon` has no scale, so its
    // layers are rendered into the safe zone already.
    adaptiveIcon: {
      backgroundImage: art('sunrise/background'),
      foregroundImage: art('sunrise/foreground'),
      monochromeImage: art('sunrise/monochrome'),
    },
    package: BUNDLE_ID,
  },
  experiments: {
    typedRoutes: true,
  },
  ios: {
    bundleIdentifier: BUNDLE_ID,
    icon: {
      dark: art('sunrise/dark'),
      light: art('sunrise/light'),
      tinted: art('sunrise/tinted'),
    },
    supportsTablet: true,
  },
  name: NAME,
  orientation: 'portrait',
  plugins: [
    'expo-router',
    // The example's icons (Material Symbols): every SVG in assets/icons becomes a native asset on both platforms, and
    // its name a type in native-icons.d.ts.
    ['@hzblj/kara-ui', {icons: {source: './assets/icons'}}],
    // Built from packages/expo-app-icons, which is why `yarn prebuild` builds it first.
    ['@hzblj/expo-app-icons', appIcons],
  ],
  scheme: 'app-icons-example',
  slug: 'expo-app-icons-example',
  userInterfaceStyle: 'automatic',
  version: '1.0.0',
} satisfies ExpoConfig
