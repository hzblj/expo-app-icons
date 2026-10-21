import {useEffect, useMemo, useState} from 'react'

import {AppIcon} from './AppIcon'
import type {AppIconName} from './types'

export const useAppIcon = () => {
  const [icon, setCurrentIcon] = useState<AppIconName | null>(null)

  useEffect(() => {
    let hasChanged = false

    const subscription = AppIcon.addChangeListener(changed => {
      hasChanged = true
      setCurrentIcon(changed)
    })

    AppIcon.getIcon().then(current => {
      if (!hasChanged) {
        setCurrentIcon(current)
      }
    })

    return () => {
      hasChanged = true
      subscription.remove()
    }
  }, [])

  return useMemo(
    () => ({
      icon,
      icons: AppIcon.getAvailableIcons(),
      isSupported: AppIcon.isSupported(),
      resetIcon: AppIcon.resetIcon,
      setIcon: AppIcon.setIcon,
    }),
    [icon]
  )
}
