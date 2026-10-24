import type {AppIconName} from '@hzblj/expo-app-icons'
import {Box, RnIcon, RnText} from '@hzblj/kara-ui'

import {CATALOG, IconPreview, titleOf} from '../artwork'
import {InlineCode} from '../ui'

const SIZE = 88

type CurrentIconProps = {
  /** `null` while `getIcon()` has not answered yet. */
  icon: AppIconName | null
  /** Android has stored it, and applies it when the app goes to the background. */
  scheduled: boolean
}

/** The selected icon, large: what `useAppIcon().icon` says. */
export const CurrentIcon = ({icon, scheduled}: CurrentIconProps) => (
  <Box bg="surface.primary" borderRadius="large" gap="s12" p="s16">
    <Box align="center" gap="s16" row>
      {icon === null ? (
        <Box bg="fill.tertiary" borderRadius="large" size={SIZE} />
      ) : (
        <Box entering="scale" key={icon}>
          <IconPreview name={icon} size={SIZE} />
        </Box>
      )}
      <Box flex={1} gap="s2">
        <RnText color="content.secondary" variant="footnoteMedium">
          {scheduled ? 'NEXT ICON' : 'CURRENT ICON'}
        </RnText>
        <RnText variant="headingXs">{icon === null ? 'Loading' : titleOf(icon)}</RnText>
        {icon !== null && CATALOG[icon] ? (
          <RnText color="content.secondary" variant="footnote">
            {CATALOG[icon].description}
          </RnText>
        ) : null}
      </Box>
    </Box>
    <InlineCode>{icon === null ? 'icon === null' : `icon === '${icon}'`}</InlineCode>
    {scheduled ? (
      <Box align="center" bg="fill.accent.base" borderRadius="medium" entering="fadeUp" gap="s8" px="s12" py="s8" row>
        <RnIcon color="content.accent" name="schedule" size="s16" />
        <RnText color="content.accent" flex={1} variant="footnoteMedium">
          Applies when you leave the app
        </RnText>
      </Box>
    ) : null}
  </Box>
)
