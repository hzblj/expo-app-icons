import {DEFAULT_APP_ICON} from '@hzblj/expo-app-icons'
import {Box, Image, type ImageProps, RnText, useAppTheme} from '@hzblj/kara-ui'
import type {ReactNode} from 'react'

import {
  ANDROID_CANVAS,
  ANDROID_SAFE_ZONE,
  ANDROID_VISIBLE,
  type AndroidArtwork,
  AndroidIconPreview,
  androidArtworkOf,
  titleOf,
} from '../artwork'
import {Section} from '../ui'
import {Note} from './note'

/** A layer tile's side: the whole 108 dp canvas. */
const TILE = 96

const inset = (dp: number) => (TILE - (TILE * dp) / ANDROID_CANVAS) / 2

/** The 72 dp a launcher shows (solid), and the 66 dp every mask keeps (dashed). */
const Guides = () => (
  <>
    <Box
      borderColor="content.tertiary"
      borderRadius="full"
      borderWidth={1}
      left={inset(ANDROID_VISIBLE)}
      position="absolute"
      size={(TILE * ANDROID_VISIBLE) / ANDROID_CANVAS}
      top={inset(ANDROID_VISIBLE)}
    />
    <Box
      borderColor="content.accent"
      borderRadius="full"
      borderStyle="dashed"
      borderWidth={1}
      left={inset(ANDROID_SAFE_ZONE)}
      position="absolute"
      size={(TILE * ANDROID_SAFE_ZONE) / ANDROID_CANVAS}
      top={inset(ANDROID_SAFE_ZONE)}
    />
  </>
)

const Tile = ({children, title}: {children: ReactNode; title: string}) => (
  <Box align="center" gap="s8">
    <Box bg="fill.tertiary" borderRadius="small" overflow="hidden" size={TILE}>
      {children}
      <Guides />
    </Box>
    <RnText color="content.secondary" variant="footnote">
      {title}
    </RnText>
  </Box>
)

/** A foreground-like layer where the plugin's insets put it: scaled around the centre, moved in dp. */
const Placed = ({artwork, scale, ...image}: ImageProps & {artwork: AndroidArtwork; scale: number}) => {
  const size = TILE * scale
  const offset = (dp: number) => (TILE - size) / 2 + (dp / ANDROID_CANVAS) * TILE

  return (
    <Image left={offset(artwork.offsetX)} position="absolute" size={size} top={offset(artwork.offsetY)} {...image} />
  )
}

const Background = ({artwork, faded = false}: {artwork: AndroidArtwork; faded?: boolean}) =>
  artwork.background ? (
    <Image absolute opacity={faded ? 'o30' : undefined} source={artwork.background} />
  ) : (
    // backgroundColor, the config's own: the icon's content, not the app's theme.
    <Box absolute opacity={faded ? 'o30' : undefined} style={{backgroundColor: artwork.backgroundColor}} />
  )

const Layers = ({artwork}: {artwork: AndroidArtwork}) => {
  const theme = useAppTheme()

  return (
    <Box bg="surface.primary" borderRadius="large" justify="space-around" px="s8" py="s16" row>
      <Tile title="Background">
        <Background artwork={artwork} />
      </Tile>
      <Tile title="Foreground">
        {/* Over its background, faded: a light foreground alone would vanish into a light tile. */}
        <Background artwork={artwork} faded />
        <Placed artwork={artwork} scale={artwork.scale} source={artwork.foreground} />
      </Tile>
      <Tile title="Monochrome">
        {artwork.monochrome ? (
          <Placed
            artwork={artwork}
            scale={artwork.monochromeScale}
            source={artwork.monochrome}
            tintColor={theme.colorString('content.primary')}
          />
        ) : null}
      </Tile>
    </Box>
  )
}

const Results = ({artwork}: {artwork: AndroidArtwork}) => (
  <Box bg="surface.primary" borderRadius="large" justify="space-around" px="s8" py="s16" row>
    <Box align="center" gap="s8">
      <AndroidIconPreview artwork={artwork} size={84} />
      <RnText color="content.secondary" variant="footnote">
        Launcher
      </RnText>
    </Box>
    {artwork.monochrome ? (
      <Box align="center" gap="s8">
        <AndroidIconPreview artwork={artwork} size={84} themed />
        <RnText color="content.secondary" variant="footnote">
          Themed
        </RnText>
      </Box>
    ) : null}
  </Box>
)

const GUIDES = 'A launcher shows the middle 72 dp (solid), and every mask keeps the 66 dp safe zone (dashed).'

const LAYERS_CAPTION = `Each layer where the plugin places it on the 108 dp canvas. ${GUIDES} foregroundScale shrinks the foreground and monochrome layers around the centre, the offsets move both in dp, and the background never moves.`

const PRIMARY_LAYERS_CAPTION = `Expo’s adaptiveIcon draws each layer over the whole 108 dp canvas, with no scale, so these come rendered into the safe zone already. ${GUIDES}`

const RESULTS_CAPTION =
  'A round launcher mask, and Android 13’s themed icon: the monochrome layer, in colours the launcher picks. For older launchers the plugin also composes square and round PNGs from the same layers.'

/** An icon's adaptive layers, and what launchers make of them. */
export const AndroidLayers = ({name}: {name: string}) => {
  const artwork = androidArtworkOf(name)

  if (!artwork) {
    return (
      <Section title="Android">
        <Note>{`${titleOf(name)} has no android entry, so the plugin adds no launcher alias for it: Android builds never list it.`}</Note>
      </Section>
    )
  }

  return (
    <>
      <Section caption={name === DEFAULT_APP_ICON ? PRIMARY_LAYERS_CAPTION : LAYERS_CAPTION} title="Android">
        <Layers artwork={artwork} />
      </Section>
      <Section caption={RESULTS_CAPTION}>
        <Results artwork={artwork} />
      </Section>
    </>
  )
}
