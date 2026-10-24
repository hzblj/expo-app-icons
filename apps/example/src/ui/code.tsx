import {Box, RnText} from '@hzblj/kara-ui'

/** The call a tile makes, in a line of code under its title. */
export const InlineCode = ({children}: {children: string}) => (
  <RnText color="content.secondary" monospaced numberOfLines={1} variant="label">
    {children}
  </RnText>
)

/** A snippet to copy. */
export const CodeBlock = ({code}: {code: string}) => (
  <Box bg="fill.tertiary" borderRadius="medium" p="s16">
    <RnText color="content.secondary" monospaced selectable variant="footnote">
      {code}
    </RnText>
  </Box>
)
