import {Box, Image, useAppTheme} from '@hzblj/kara-ui'
import {Platform} from 'react-native'

import {
  ANDROID_CANVAS,
  ANDROID_VISIBLE,
  type AndroidArtwork,
  androidArtworkOf,
  type IosArtwork,
  iosArtworkOf,
} from './artwork'
import {DARK_BACKDROP} from './images'

/** iOS's icon mask: a continuous corner of about 22% of the side. */
const IOS_CORNER = 0.2237

export type IosAppearance = 'dark' | 'light' | 'tinted'

type IosIconPreviewProps = {
  /**
   * `light` by default, whatever the app's own appearance: the home screen picks dark or tinted icons by a setting of
   * its own, not the system's dark mode.
   */
  appearance?: IosAppearance
  artwork: IosArtwork
  size: number
}

/** An icon as the iOS home screen draws it: one of its appearances, in the system's mask. */
export const IosIconPreview = ({appearance: shown = 'light', artwork, size}: IosIconPreviewProps) => (
  // The mask is the icon's geometry, not a theme radius: it scales with the icon.
  <Box overflow="hidden" size={size} style={{borderCurve: 'continuous', borderRadius: size * IOS_CORNER}}>
    {shown === 'dark' && artwork.transparentDark ? <Image absolute source={DARK_BACKDROP} /> : null}
    <Image absolute source={artwork.appearances[shown]} />
  </Box>
)

type AndroidIconPreviewProps = {
  artwork: AndroidArtwork
  size: number
  /** The themed icon: the monochrome layer in the accent, on a pale disc. The regular one without a monochrome layer. */
  themed?: boolean
}

/**
 * An adaptive icon as a round launcher mask shows it: the layers on their 108 dp canvas, of which the middle 72 dp
 * show, the foreground scaled and moved the way the plugin's insets place it.
 */
export const AndroidIconPreview = ({artwork, size, themed = false}: AndroidIconPreviewProps) => {
  const theme = useAppTheme()
  const monochrome = themed ? artwork.monochrome : null
  const canvas = (size * ANDROID_CANVAS) / ANDROID_VISIBLE
  const edge = (size - canvas) / 2
  const layer = canvas * (monochrome ? artwork.monochromeScale : artwork.scale)
  const left = (size - layer) / 2 + (artwork.offsetX / ANDROID_CANVAS) * canvas
  const top = (size - layer) / 2 + (artwork.offsetY / ANDROID_CANVAS) * canvas

  return (
    <Box
      bg={monochrome ? 'fill.accent.base' : undefined}
      borderRadius="full"
      overflow="hidden"
      size={size}
      // The config's own colour, where it has no background image: the icon's content, not the app's theme.
      style={monochrome || artwork.background ? undefined : {backgroundColor: artwork.backgroundColor}}
    >
      {!monochrome && artwork.background ? (
        <Image left={edge} position="absolute" size={canvas} source={artwork.background} top={edge} />
      ) : null}
      <Image
        left={left}
        position="absolute"
        size={layer}
        source={monochrome ?? artwork.foreground}
        tintColor={monochrome ? theme.colorString('content.accent') : undefined}
        top={top}
      />
    </Box>
  )
}

/**
 * An icon as this platform shows it: the adaptive icon on Android, the iOS appearance on iOS. An icon the platform
 * does not ship is drawn as the other one does, and one with no artwork at all as an empty disc.
 */
export const IconPreview = ({name, size}: {name: string; size: number}) => {
  const ios = iosArtworkOf(name)
  const android = androidArtworkOf(name)

  if (android && (Platform.OS === 'android' || !ios)) {
    return <AndroidIconPreview artwork={android} size={size} />
  }

  return ios ? <IosIconPreview artwork={ios} size={size} /> : <Box bg="fill.tertiary" borderRadius="full" size={size} />
}
