import {AppIcon, useAppIcon} from '@hzblj/expo-app-icons'
import {Box, Button, Divider, Island, LabeledContent, RnText, VStack} from '@hzblj/kara-ui'
import {Fragment, useState} from 'react'

import {titleOf} from '../artwork'
import {CodeBlock, InlineCode, Lead, Page, Section} from '../ui'
import {useChangeLog} from './change-log'
import {RESULT_ORDER, RESULTS} from './results'

/** The result only one platform answers with. */
const ANSWERED_BY: Partial<Record<string, string>> = {scheduled: 'Android'}

/** Past this many characters a line of the snippet breaks: the width of a phone. */
const LINE = 40

/** The names, as many to a commented line as fit. */
const availableCode = (names: readonly string[]) => {
  const lines = ['//']

  for (const name of names.map(entry => `'${entry}'`)) {
    const last = lines.length - 1
    const line = `${lines[last]} ${name},`

    if (line.length <= LINE || lines[last] === '//') {
      lines[last] = line
    } else {
      lines.push(`// ${name},`)
    }
  }

  return ['AppIcon.getAvailableIcons()', ...lines].join('\n').replace(/,$/, '')
}

/** A name no build of the example ships. */
const UNKNOWN = 'summer'

const LISTENER_CODE = `const subscription =
  AppIcon.addChangeListener(name => {
    console.log('Selected icon:', name)
  })

subscription.remove()`

const HOOK_CODE = `const {
  icon, // null while loading
  icons,
  isSupported,
  resetIcon,
  setIcon,
} = useAppIcon()`

const formatTime = (time: Date) =>
  [time.getHours(), time.getMinutes(), time.getSeconds()].map(part => String(part).padStart(2, '0')).join(':')

/** What the native module reports about this build, live. */
const ThisBuild = () => {
  const {icon, icons, isSupported} = useAppIcon()

  return (
    <Section
      caption="isSupported() is false without the native module (Expo Go) or without alternates. getIcon() then answers default, and every change answers unsupported."
      title="This build"
    >
      <Island>
        <VStack bg="surface.primary" borderRadius="large" px="s16" py="s4" wide>
          <LabeledContent label="isSupported()" value={String(isSupported)} />
          <Divider />
          <LabeledContent label="getIcon()" value={icon === null ? 'loading' : `'${icon}'`} />
          <Divider />
          <LabeledContent label="getAvailableIcons()" value={`${icons.length} icons`} />
        </VStack>
      </Island>
    </Section>
  )
}

const ResultTable = () => (
  <Box bg="surface.primary" borderRadius="large">
    {RESULT_ORDER.map((result, index) => (
      <Fragment key={result}>
        {index > 0 ? <Box bg="border.tertiary" h={1} ml="s16" /> : null}
        <Box gap="s4" px="s16" py="s12">
          <Box align="center" gap="s8" row>
            <InlineCode>{`'${result}'`}</InlineCode>
            {ANSWERED_BY[result] ? (
              <Box bg="fill.tertiary" borderRadius="full" px="s8" py="s2">
                <RnText color="content.secondary" variant="captionMedium">
                  {ANSWERED_BY[result]}
                </RnText>
              </Box>
            ) : null}
          </Box>
          <RnText color="content.secondary" variant="footnote">
            {RESULTS[result]}
          </RnText>
        </Box>
      </Fragment>
    ))}
  </Box>
)

type Outcome = {code: string; reason: string}

/** The module's own reason, without the call chain Expo wraps it in. */
const reasonOf = (message: string) => /Caused by: \w+: (.+?)(?: \(at [^)]*\))?$/s.exec(message)?.[1] ?? message

/** `setIcon` with a name the build does not ship: it rejects. */
const UnknownName = () => {
  const [outcome, setOutcome] = useState<Outcome | null>(null)

  const attempt = async () => {
    try {
      setOutcome({code: `'${await AppIcon.setIcon(UNKNOWN)}'`, reason: 'It resolved instead of rejecting.'})
    } catch (error) {
      const {code, message} = error as {code?: string; message?: string}
      setOutcome({code: code ?? 'Error', reason: reasonOf(message ?? String(error))})
    }
  }

  return (
    <Section
      caption="A name the build doesn’t ship rejects with ERR_UNKNOWN_APP_ICON: the native side knows only what the plugin generated at prebuild."
      title="An unknown name"
    >
      <Island>
        <Button label={`setIcon('${UNKNOWN}')`} onPress={attempt} variant="secondary" />
      </Island>
      {outcome ? (
        <Box bg="surface.primary" borderRadius="large" entering="fadeUp" gap="s4" p="s16">
          <RnText color="content.destructive" variant="footnoteMedium">
            {outcome.code}
          </RnText>
          <RnText color="content.secondary" variant="footnote">
            {outcome.reason}
          </RnText>
        </Box>
      ) : null}
    </Section>
  )
}

/** Every change the app's listener heard, from any tab. */
const Listener = () => {
  const changes = useChangeLog()

  return (
    <Section
      caption="A listener hears the selections made through this API, from any screen of the app. It is not an OS-wide event stream."
      title="Listeners"
    >
      <Box bg="surface.primary" borderRadius="large">
        {changes.length === 0 ? (
          <RnText color="content.secondary" p="s16" variant="subheadline">
            Change the icon on the Icons tab, and the listener the app adds at launch logs it here.
          </RnText>
        ) : (
          changes.map((change, index) => (
            <Fragment key={change.count}>
              {index > 0 ? <Box bg="border.tertiary" h={1} ml="s16" /> : null}
              <Box align="center" entering="fadeDown" gap="s12" px="s16" py="s12" row>
                <RnText color="content.tertiary" variant="footnoteMedium">
                  {`#${change.count}`}
                </RnText>
                <RnText flex={1} variant="subheadlineMedium">
                  {titleOf(change.name)}
                </RnText>
                <RnText color="content.secondary" variant="footnote">
                  {formatTime(change.time)}
                </RnText>
              </Box>
            </Fragment>
          ))
        )}
      </Box>
      <CodeBlock code={LISTENER_CODE} />
    </Section>
  )
}

/** The runtime API, call by call. */
export const ApiScreen = () => (
  <Page>
    <Lead>
      AppIcon is the whole runtime API: what the build ships, which icon is selected, and changing it. useAppIcon()
      wraps it for a picker.
    </Lead>
    <ThisBuild />
    <Section
      caption="The primary icon first, then the alternates by name: on iOS the asset catalog’s alternate icons, on Android the launcher aliases the plugin added to the manifest."
      title="Available icons"
    >
      <CodeBlock code={availableCode(AppIcon.getAvailableIcons())} />
    </Section>
    <Section caption="What setIcon() and resetIcon() resolve with, platform by platform." title="Results">
      <ResultTable />
    </Section>
    <UnknownName />
    <Listener />
    <Section
      caption="useAppIcon() reads getIcon() once, then follows every change through a listener."
      title="The hook"
    >
      <CodeBlock code={HOOK_CODE} />
    </Section>
  </Page>
)
