import type {AppIconName} from '@hzblj/expo-app-icons'
import {Box, Pressable, RnIcon, RnText} from '@hzblj/kara-ui'

import {IconPreview, titleOf} from '../artwork'

type IconTileProps = {
  name: AppIconName
  onPress: () => void
  /** The selected icon: an accent ring and a check. */
  selected: boolean
}

/** One icon of the build to pick: a real preview of its artwork, and its name. */
export const IconTile = ({name, onPress, selected}: IconTileProps) => (
  <Pressable
    accessibilityHint="Makes it the app’s icon"
    accessibilityLabel={titleOf(name)}
    accessibilityValue={selected ? 'Selected' : undefined}
    align="center"
    animate="quick"
    bg="surface.primary"
    borderColor={selected ? 'fill.accent.primary' : 'surface.primary'}
    borderRadius="large"
    borderWidth={2}
    gap="s8"
    haptic="selection"
    onPress={onPress}
    pb="s12"
    pt="s16"
    px="s8"
  >
    <IconPreview name={name} size={64} />
    <RnText color={selected ? 'content.accent' : 'content.primary'} numberOfLines={1} variant="subheadlineMedium">
      {titleOf(name)}
    </RnText>
    {selected ? (
      <Box
        align="center"
        bg="fill.accent.primary"
        borderRadius="full"
        entering="scale"
        justify="center"
        position="absolute"
        right={8}
        size={22}
        top={8}
      >
        <RnIcon color="content.on.accent" name="check" size="s16" />
      </Box>
    ) : null}
  </Pressable>
)
