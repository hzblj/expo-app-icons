import {DEFAULT_APP_ICON} from '@hzblj/expo-app-icons'
import {useState} from 'react'

import {CONFIGURED_ICONS, PLUGIN_OPTIONS, PRIMARY_ICON_KEYS} from '../artwork'
import {CodeBlock, Lead, Page, Section} from '../ui'
import {AndroidLayers} from './android-layers'
import {entryCode, keysCode} from './config-code'
import {IconSelector} from './icon-selector'
import {IosAppearances} from './ios-appearances'

const PLUGIN_CAPTION = 'From the app config this build runs on, as app.config.ts passes it to the plugin.'

const ART_CAPTION = 'art() is the config’s own helper for a PNG in ./assets/app-icons.'

const PRIMARY_CAPTION =
  'default is reserved for the primary icon, which stays on Expo’s own keys: the plugin only adds the alternates.'

/** One icon at a time: its configuration, its iOS appearances and its Android layers. */
export const SetupScreen = () => {
  const [name, setName] = useState(DEFAULT_APP_ICON)
  const entry = PLUGIN_OPTIONS.icons?.[name]
  const code = entry ? entryCode(name, entry) : keysCode(PRIMARY_ICON_KEYS)
  const caption = entry ? PLUGIN_CAPTION : PRIMARY_CAPTION

  return (
    <Page>
      <Lead>
        Each alternate is one entry in the plugin’s options. At prebuild it writes an icon set into the asset catalog on
        iOS, and a launcher alias with adaptive icon resources on Android.
      </Lead>
      <IconSelector names={CONFIGURED_ICONS} onChange={setName} selected={name} />
      <Section caption={code.includes('art(') ? `${caption} ${ART_CAPTION}` : caption} title="Configuration">
        <CodeBlock code={code} />
      </Section>
      <IosAppearances name={name} />
      <AndroidLayers name={name} />
    </Page>
  )
}
