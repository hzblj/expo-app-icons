# @hzblj/expo-app-icons

[![npm](https://img.shields.io/npm/v/@hzblj/expo-app-icons.svg)](https://www.npmjs.com/package/@hzblj/expo-app-icons)
[![license](https://img.shields.io/npm/l/@hzblj/expo-app-icons.svg)](https://github.com/hzblj/expo-app-icons/blob/main/LICENSE)

Alternate app icons for Expo on iOS and Android. A config plugin generates the icons at prebuild, and a native module switches between them at runtime.

- iOS: PNG icons with dark and tinted appearances, or Icon Composer `.icon` bundles
- Android: adaptive icons with themed (monochrome) layers, plus legacy square and round PNGs
- Per-icon foreground scale and offset on Android
- An icon can exist on one platform only
- `useAppIcon()` hook for building an icon picker

## Install

```sh
npx expo install @hzblj/expo-app-icons
```

Requires Expo SDK 57 or newer and a [development build](https://docs.expo.dev/develop/development-builds/introduction/). Expo Go doesn't include this native module.

## Configure

Register the plugin in `app.config.ts`. Paths are relative to the project root.

```ts
plugins: [
  ['@hzblj/expo-app-icons', {
    icons: {
      black_friday: {
        ios: './assets/black-friday.icon',
        android: {
          foregroundImage: './assets/foreground.png',
          backgroundImage: './assets/background.png',
          foregroundScale: 0.75,
          foregroundOffsetX: 0,
          foregroundOffsetY: -2,
          monochromeImage: './assets/monochrome.png',
          monochromeScale: 0.8,
        },
      },
    },
  }],
]
```

Config types (`AppIconsPluginOptions`, `AppIconConfig`, `AndroidAppIcon`, `IosAppIcon`) are exported from `@hzblj/expo-app-icons/plugin`.

`default` is reserved for the app's primary icon, which you keep configuring through Expo's `ios.icon` and `android.adaptiveIcon`.

Names must match `[a-z][a-z0-9_]*` and must not end in `_background`, `_foreground`, `_monochrome` or `_round`, because they become Android resource names.

Run `npx expo prebuild` and rebuild the native app after changing icons. Launcher icons are bundled native resources, so an OTA update can't add or replace them.

### Android options

| Option | Default | Meaning |
| --- | --- | --- |
| `foregroundImage` | Required | Square PNG foreground with transparent margins |
| `backgroundImage` | None | Full-size square PNG background; takes precedence over the color |
| `backgroundColor` | `#FFFFFF` | Background color in `#RRGGBB` or `#AARRGGBB` format |
| `foregroundScale` | `1` | Scale relative to the full canvas, greater than 0 and at most 1 |
| `foregroundOffsetX` | `0` | Horizontal translation in dp on a 108 dp canvas; positive moves right |
| `foregroundOffsetY` | `0` | Vertical translation in dp on a 108 dp canvas; positive moves down |
| `monochromeImage` | None | Alpha silhouette for themed icons; the launcher chooses the color |
| `monochromeScale` | Foreground scale | Independent themed-icon scale, greater than 0 and at most 1 |

Offsets must be finite numbers between -108 and 108 dp. They apply to both foreground and monochrome. Content shifted outside the canvas is clipped. Backgrounds never scale or move.

Adaptive layers use drawable insets. Legacy square and round PNGs apply the same proportional foreground scale and translation, with pixel rounding; the circular mask is applied after compositing. Launcher masks and animation may change the final visible crop. Keep important artwork within the center safe region and export the full design frame with its margins. Put full-bleed color fields in the background: scaling a foreground also scales any color blocks it contains.

### iOS options

Use an Icon Composer `.icon` bundle, a PNG path, or appearance variants:

```ts
ios: {
  light: './assets/icon-light.png',
  dark: './assets/icon-dark.png',
  tinted: './assets/icon-tinted.png',
}
```

PNG variants are generated at 1024 × 1024. Android transforms do not affect iOS.

## Usage

```ts
import {AppIcon, DEFAULT_APP_ICON, useAppIcon} from '@hzblj/expo-app-icons'

const names = AppIcon.getAvailableIcons()
const current = await AppIcon.getIcon()
const result = await AppIcon.setIcon('black_friday')
await AppIcon.resetIcon()

const subscription = AppIcon.addChangeListener(name => {
  console.log('Selected icon:', name)
})
subscription.remove()
```

`getAvailableIcons()` returns `default` first, then the alternates sorted by name. `AppIcon.isSupported()` reports native support. `useAppIcon()` provides `icon` (`null` while loading), `icons`, `isSupported`, `setIcon` and `resetIcon`.

`setIcon` resolves with one of:

| Result | Meaning |
| --- | --- |
| `changed` | iOS applied the selection |
| `scheduled` | Android stored the selection and will apply it when the app goes to the background |
| `unchanged` | The requested icon was already selected |
| `unsupported` | Native module or platform support is unavailable |

Unknown names reject with `ERR_UNKNOWN_APP_ICON`. Without native support, `getIcon()` returns `default` and changes return `unsupported`. Listeners report selections made through this API; they are not an OS-wide event stream.

## Platform behavior

- iOS shows its own confirmation alert after the icon changes. The text comes from iOS and can't be hidden without private API. A change requested while the app isn't active waits until it is.
- Android swaps the launcher aliases when the app goes to the background, because disabling the alias the app was launched from closes it on some devices. `getIcon()` already returns the pending selection.
- Launchers may cache icons, remove an old home screen shortcut, or decorate suggested apps with a colored ring. That is launcher behavior, not something this package controls.
- If an app update removes the icon a user had selected, Android re-enables the default icon on the next launch or package update, and iOS falls back to the primary icon by itself. Test this on a device before shipping an update that removes icons.

## Example

The [example app](https://github.com/hzblj/expo-app-icons/tree/main/apps/example) ships a family of icons drawn for it: PNG icons with dark and tinted appearances, an Icon Composer document on iOS alone, an icon on Android alone over a background color, and foreground scales and offsets per icon. It switches between them with `useAppIcon()`, shows the plugin configuration behind each icon with its iOS appearances and Android layers, and runs the whole `AppIcon` API. Clone the repository and run it:

```sh
yarn && yarn prebuild && yarn ios
```

## License

MIT © Jan Blazej
