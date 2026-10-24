import {Box, useAppTheme} from '@hzblj/kara-ui'
import {useMemo} from 'react'
import {Platform, Text} from 'react-native'

const MONOSPACE = Platform.select({android: 'monospace', default: 'Menlo'})

const useCodeStyle = (size: number) => {
  const theme = useAppTheme()

  return useMemo(
    () => ({
      color: theme.color('content.secondary'),
      fontFamily: MONOSPACE,
      fontSize: size,
      lineHeight: Math.round(size * 1.5),
    }),
    [size, theme]
  )
}

/** The call a tile makes, in a line of code under its title. */
export const InlineCode = ({children}: {children: string}) => (
  <Text numberOfLines={1} style={useCodeStyle(12)}>
    {children}
  </Text>
)

/** A snippet to copy. Plain React Native text: kara's own text has no monospaced face, and should not need one. */
export const CodeBlock = ({code}: {code: string}) => (
  <Box bg="fill.tertiary" borderRadius="medium" p="s16">
    <Text selectable style={useCodeStyle(13)}>
      {code}
    </Text>
  </Box>
)
