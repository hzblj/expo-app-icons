# expo-app-icons

Turborepo + Yarn 4 workspaces for **`@hzblj/expo-app-icons`**: alternate app icons for Expo, generated at prebuild by a
config plugin and switched at runtime by a native module, on iOS and Android. React Native and Expo only, no web.

Every package has its own `CLAUDE.md`: read that one before touching it.

| Path | Package | What lives there |
| --- | --- | --- |
| `packages/expo-app-icons/` | `@hzblj/expo-app-icons` | The JavaScript API (`src/`), the config plugin (`plugin/`), the `ExpoAppIcons` module (`ios/`, `android/`) and the plugin's tests. |
| `apps/example/` | `expo-app-icons-example` (private) | Expo Router app built with `@hzblj/kara-ui`: a picker over `useAppIcon()`, each icon's plugin configuration, iOS appearances and Android layers, and the `AppIcon` API live. Its icon family lives in `assets/app-icons`. Runs the package from **source**. |
| `scripts/` | | `pack-check.mjs`: the tarball as npm gets it, the plugin loaded from it, a consumer type-checked against it. |
| `.changeset/`, `.github/workflows/` | | Release notes (`yarn changeset`), CI (Biome, typecheck, tests, pack check, the Android module compiled) and the changesets → npm release. |

## Commands

```bash
yarn ios / yarn android      # run the example (dev client)
yarn prebuild                # build the package, then a clean `expo prebuild` of the example
yarn test                    # the config plugin's tests (node:test)
yarn typecheck / yarn lint   # tsc, Biome
yarn pack:check              # what npm receives, the plugin loaded from it, and a consumer type-check
yarn example icons:render    # the example's icon PNGs, from their SVGs (needs rsvg-convert)
yarn changeset               # describe a change for the next release
```

## Conventions that bite

**The example runs the package's source; the world runs `build/`.** The package's `exports` names a `source` entry,
which the example's `metro.config.js` maps and its `tsconfig.json` mirrors with `paths`, so nothing waits for a build.
Not a global `source` condition: published packages ship one too, and kara-ui's points at platform-split sources. The
config plugin is the exception: prebuild loads `app.plugin.js` → `plugin/build`, which is why `yarn prebuild` builds
the package first. The example's `tsconfig.json` maps `/plugin` to `plugin/src/types.ts`, for the option types alone.

**The example's icons are drawn here.** Each is one SVG in `apps/example/assets/app-icons/sources`, its palettes as
CSS, on one grid: a 576 pt motif on the 1024 pt canvas, 48 pt gaps, 96 pt bands and stems, circles, quarter discs and
pills only. `render.mjs` renders every iOS appearance and Android layer from it; `glass.icon` is an Icon Composer
document, whose previews come from Icon Composer's `icontool`. The Android layers keep the iOS geometry and the config
fits them with `foregroundScale: 0.667`, except Sunrise, the primary icon: Expo's `adaptiveIcon` has no scale, so its
layers are rendered into the safe zone. Edit the SVG, re-render, prebuild again.

**The screens read the config the build runs on.** `Constants.expoConfig.plugins` gives the Setup tab the plugin's
options as app.config.ts passed them, and the previews find each PNG by the path the config names. Metro bundles only
what a `require` spells out, so `src/artwork/images.ts` lists every PNG: a new icon needs its lines there.

**Switching shows on the home screen.** iOS switches at once, behind its own alert, on the simulator too. Android
switches when the app goes to the background: leave the app on the emulator to see it.

**Publish through Yarn, tag through changesets.** `yarn release` runs `yarn npm publish` in every public workspace and
then `changeset tag`. Never `changeset publish`: its npm call would ship `workspace:` ranges verbatim.

**Docs copy has no em dashes.** Not in the READMEs, changesets or the example's captions. Rewrite with a comma, a
colon, parentheses or a second sentence. Code comments are exempt.

**Commits are Jan's alone.** Author `Jan Blazej <hello@janblazej.dev>` (set locally in this repo), no co-author or
generated-by lines.

Code style is Biome-enforced (`@hzblj/biome-config`): 2 spaces, 120 cols, single quotes, no semicolons, sorted imports
and object keys. Named exports and `const` arrow functions; `type` over `interface`.
