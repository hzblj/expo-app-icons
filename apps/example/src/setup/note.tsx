import {Box, RnIcon, RnText} from '@hzblj/kara-ui'

/** A line in place of a preview, where an icon has nothing to show. */
export const Note = ({children}: {children: string}) => (
  <Box align="center" bg="surface.primary" borderRadius="large" gap="s12" p="s16" row>
    <RnIcon color="content.secondary" name="info" size="s20" />
    <RnText color="content.secondary" flex={1} variant="subheadline">
      {children}
    </RnText>
  </Box>
)
