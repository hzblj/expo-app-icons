# @hzblj/expo-app-icons

Alternate app icons: the JavaScript API (`src/` → `build/`), the config plugin that generates the icons at prebuild
(`plugin/src` → `plugin/build`, CommonJS for Node) and the `ExpoAppIcons` module that switches them (`ios/`,
`android/`).

| Path | What it is |
| --- | --- |
| `src/AppIcon.ts` | `AppIcon`: `getAvailableIcons` (cached, `default` first, then the alternates sorted), `getIcon`, `setIcon`, `resetIcon` (`setIcon('default')`), `isSupported`, `addChangeListener`. Without the module (Expo Go, Jest) it answers `default` and `unsupported`. The listeners live in JavaScript and hear only `setIcon` calls through this API that changed something. |
| `src/useAppIcon.ts` | `icon` (`null` until `getIcon()` answers; a change heard first wins over that answer), `icons`, `isSupported`, `setIcon`, `resetIcon`. |
| `plugin/src/icons.ts` | `normalizeIcons`: names (`[a-z][a-z0-9_]*`, never `default`, no `_background`, `_foreground`, `_monochrome` or `_round` suffix), option validation and defaults. `resolveImage` fails on a missing file, at mod time. |
| `plugin/src/withIosAppIcons.ts` | PNGs → `Images.xcassets/AppIcon-<name>.appiconset` at 1024 (light and tinted flattened onto white, dark keeps its alpha); a `.icon` bundle → `AppIcon-<name>.icon`, a resource of the app target typed `folder.iconcomposer.icon`; every name in `ASSETCATALOG_COMPILER_ALTERNATE_APPICON_NAMES`. |
| `plugin/src/withAndroidAppIcons.ts` | Per icon, `mipmap-*/app_icon_<name>{,_round,_foreground,_background,_monochrome}.png` at five densities (the legacy square and round ones composed with Jimp), `mipmap-anydpi-v26/app_icon_<name>{,_round}.xml` with insets for scale and offset, an `app_icon_<name>_background` colour. The launcher filter moves from `MainActivity` to one `activity-alias` per icon (`.AppIcon_<name>`, only `default` enabled), each tagged with `com.hzblj.expoappicons.NAME` meta-data. |
| `ios/AppIcons.swift` | The alternates from `CFBundleAlternateIcons` (prefix stripped), `setAlternateIconName` on the main actor, after waiting for `didBecomeActive` when the app is not active. |
| `android/.../AppIconSwitcher.kt` | The aliases from the package's own activities (by the meta-data), the choice stored as `pendingIcon` in SharedPreferences, `enableOnly` over the component settings with `DONT_KILL_APP`, `repair` when no alias is enabled. |
| `android/.../ExpoAppIconsModule.kt`, `AppIconPackageReplacedReceiver.kt` | Applies the pending icon on `ProcessLifecycleOwner`'s `onStop`, repairs on module create and on `MY_PACKAGE_REPLACED`. All of it off the main thread. |

**The names meet by prefix.** The plugin writes `AppIcon-<name>` on iOS and `.AppIcon_<name>` aliases with the
`com.hzblj.expoappicons.NAME` meta-data on Android; each native side reads its own back by the same prefix and key.
Change one and change the other with it.

**Android never switches in the foreground.** Disabling the alias the app was launched from closes it on some
launchers, so `setIcon` stores the choice (`scheduled`) and the process going to the background applies it.
`getIcon()` answers the pending one at once. Background work never throws: a failure is logged under `ExpoAppIcons`,
and switching to the icon already enabled makes no empty `setComponentEnabledSettings` call (it throws on Android 13+).

**iOS's alert is the system's.** `setAlternateIconName` shows it, and no public API hides it.

**The plugin owns its prefix and nothing else.** Every run first removes the `AppIcon-*` and `app_icon_*` entries it
wrote before, so a renamed or removed icon leaves nothing behind and the rest of the native projects stays as it was.
A run over unchanged options is byte-identical: the tests assert it.

**`default` is the primary icon,** which stays on Expo's own keys (`ios.icon`, `android.adaptiveIcon`). Launcher icons
are native resources: a change needs a prebuild and a native build, never an OTA update.

**Tests.** `yarn test` (node:test over `plugin/test`: option validation, adaptive insets and legacy composition, Android
resources, colours and manifest aliases, iOS icon sets and the Xcode project against `plugin/test/fixtures`). The
native module has no unit tests: the example is the check, on the iOS simulator (it switches at once) or the Android
emulator (leave the app).

Code style follows `@hzblj/biome-config`. Docs copy (README, changesets) has no em dashes.
