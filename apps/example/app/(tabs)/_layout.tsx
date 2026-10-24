import {Tabs} from '@hzblj/kara-ui/router'

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen icon="apps" name="(icons)" selectedIcon="apps-filled" title="Icons" />
      <Tabs.Screen icon="tune" name="setup" selectedIcon="tune-filled" title="Setup" />
      <Tabs.Screen icon="data-object" name="api" selectedIcon="data-object-filled" title="API" />
    </Tabs>
  )
}
