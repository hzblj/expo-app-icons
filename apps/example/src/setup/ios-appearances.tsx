import {DEFAULT_APP_ICON} from '@hzblj/expo-app-icons'
import {Box, RnText} from '@hzblj/kara-ui'

import {type IosAppearance, IosIconPreview, iosArtworkOf, titleOf} from '../artwork'
import {Section} from '../ui'
import {Note} from './note'

const APPEARANCES: {appearance: IosAppearance; title: string}[] = [
  {appearance: 'light', title: 'Light'},
  {appearance: 'dark', title: 'Dark'},
  {appearance: 'tinted', title: 'Tinted'},
]

const pngCaption = (primary: boolean) =>
  `Three PNGs, which ${primary ? 'Expo writes into the app’s primary icon set' : 'the plugin writes into an icon set of their own'}, at 1024 pt. Dark has no background of its own: iOS puts its dark gradient behind it. Tinted is grayscale, and iOS colours it by luminance.`

const COMPOSER_CAPTION =
  'An Icon Composer document, copied into the Xcode project as it is. iOS renders its layers itself, Liquid Glass and all three appearances included: these previews are Icon Composer’s.'

/** The icon in each of the appearances the iOS home screen can show it in. */
export const IosAppearances = ({name}: {name: string}) => {
  const artwork = iosArtworkOf(name)

  return (
    <Section
      caption={artwork ? (artwork.composer ? COMPOSER_CAPTION : pngCaption(name === DEFAULT_APP_ICON)) : undefined}
      title="iOS"
    >
      {artwork ? (
        <Box bg="surface.primary" borderRadius="large" justify="space-around" px="s8" py="s16" row>
          {APPEARANCES.map(({appearance, title}) => (
            <Box align="center" gap="s8" key={appearance}>
              <IosIconPreview appearance={appearance} artwork={artwork} size={84} />
              <RnText color="content.secondary" variant="footnote">
                {title}
              </RnText>
            </Box>
          ))}
        </Box>
      ) : (
        <Note>{`${titleOf(name)} has no ios entry, so the plugin generates nothing for it there: iOS builds never list it.`}</Note>
      )}
    </Section>
  )
}
