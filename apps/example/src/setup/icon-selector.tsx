import {Box, Pressable, RnText} from '@hzblj/kara-ui'

import {CATALOG, IconPreview, titleOf} from '../artwork'

type IconSelectorProps = {
  names: readonly string[]
  onChange: (name: string) => void
  selected: string
}

/** Every configured icon as a small preview to pick, the picked one ringed in the accent and named below. */
export const IconSelector = ({names, onChange, selected}: IconSelectorProps) => (
  <Box bg="surface.primary" borderRadius="large" gap="s12" p="s12">
    <Box justify="space-between" row>
      {names.map(name => (
        <Pressable
          accessibilityLabel={titleOf(name)}
          accessibilityValue={name === selected ? 'Selected' : undefined}
          animate="quick"
          borderColor={name === selected ? 'fill.accent.primary' : 'surface.primary'}
          borderRadius="large"
          borderWidth={2}
          haptic="selection"
          key={name}
          onPress={() => onChange(name)}
          p="s4"
        >
          <IconPreview name={name} size={40} />
        </Pressable>
      ))}
    </Box>
    <Box gap="s2" px="s4">
      <RnText variant="subheadlineMedium">{titleOf(selected)}</RnText>
      {CATALOG[selected] ? (
        <RnText color="content.secondary" variant="footnote">
          {CATALOG[selected].description}
        </RnText>
      ) : null}
    </Box>
  </Box>
)
