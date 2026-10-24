import {type AppIconChange, type AppIconName, DEFAULT_APP_ICON, useAppIcon} from '@hzblj/expo-app-icons'
import {Box, Button, Island, Label, RnText, Text, VStack} from '@hzblj/kara-ui'
import {useEffect, useState} from 'react'
import {AppState, Platform} from 'react-native'

import {RESULTS} from '../api'
import {titleOf} from '../artwork'
import {Grid, InlineCode, Lead, Page, Section} from '../ui'
import {CurrentIcon} from './current-icon'
import {IconTile} from './icon-tile'

const SWITCHING = Platform.select({
  android:
    'Android swaps the launcher icon once the app goes to the background, because disabling the alias the app was launched from closes it on some devices. Leave the app to see the new one.',
  default:
    'iOS confirms every change with an alert of its own. Its text comes from iOS, and an app can’t hide it without private API.',
})

/** A call that changes the icon, as code: what it resolved with, or why it rejected. */
type Call = {code: string} & ({result: AppIconChange} | {error: string})

/** Shown where the build has no alternates to switch to: Expo Go, or a build without the plugin. */
const Unsupported = () => (
  <Island>
    <VStack align="start" bg="fill.accent.base" borderRadius="large" p="s16" spacing="s8" wide>
      <Label color="content.accent" icon="info" title="No alternate icons here" variant="headline" />
      <Text color="content.secondary" variant="subheadline">
        This build has no native module or no alternates. Run the example as a development build after yarn prebuild.
      </Text>
    </VStack>
  </Island>
)

/** The last `setIcon` call and what it resolved with. */
const LastCall = ({call}: {call: Call}) => (
  <Box bg="surface.primary" borderRadius="large" entering="fadeUp" gap="s4" key={call.code} p="s16">
    <InlineCode>{call.code}</InlineCode>
    {'result' in call ? (
      <Box align="center" gap="s8" row>
        <Box bg="fill.accent.base" borderRadius="full" px="s8" py="s2">
          <RnText color="content.accent" variant="footnoteMedium">
            {`'${call.result}'`}
          </RnText>
        </Box>
        <RnText color="content.secondary" flex={1} variant="footnote">
          {RESULTS[call.result]}
        </RnText>
      </Box>
    ) : (
      <RnText color="content.destructive" variant="footnote">
        {call.error}
      </RnText>
    )}
  </Box>
)

/** The picker: the current icon, every icon the build ships, and the way back to the primary one. */
export const IconsScreen = () => {
  const {icon, icons, isSupported, resetIcon, setIcon} = useAppIcon()
  const [call, setCall] = useState<Call | null>(null)
  // What Android has stored and not applied yet: it applies it as the app goes to the background.
  const [scheduled, setScheduled] = useState<AppIconName | null>(null)

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'background') {
        setScheduled(null)
      }
    })

    return () => subscription.remove()
  }, [])

  const run = async (name: AppIconName, code: string, change: () => Promise<AppIconChange>) => {
    try {
      const result = await change()

      setCall({code, result})

      if (result !== 'unchanged') {
        setScheduled(result === 'scheduled' ? name : null)
      }
    } catch (error) {
      setCall({code, error: error instanceof Error ? error.message : String(error)})
    }
  }

  return (
    <Page>
      <Lead>
        The config plugin generated every icon here at prebuild. Pick one and the home screen follows, through
        useAppIcon().
      </Lead>
      {isSupported ? null : <Unsupported />}
      <CurrentIcon icon={icon} scheduled={scheduled !== null && scheduled === icon} />
      <Section caption={SWITCHING} title={`${icons.length} icons in this build`}>
        <Grid
          columns={3}
          items={icons}
          keyOf={name => name}
          render={name => (
            <IconTile
              name={name}
              onPress={() => run(name, `await setIcon('${name}')`, () => setIcon(name))}
              selected={name === icon}
            />
          )}
        />
      </Section>
      {call ? (
        <Section title="Last change">
          <LastCall call={call} />
        </Section>
      ) : null}
      <Section
        caption={`resetIcon() is setIcon('default'): back to ${titleOf(DEFAULT_APP_ICON)}, the primary icon, which the app config sets through Expo’s own icon keys.`}
      >
        <Island>
          <Button
            disabled={icon === null || icon === DEFAULT_APP_ICON}
            label={`Back to ${titleOf(DEFAULT_APP_ICON)}`}
            onPress={() => run(DEFAULT_APP_ICON, 'await resetIcon()', resetIcon)}
            variant="secondary"
          />
        </Island>
      </Section>
    </Page>
  )
}
