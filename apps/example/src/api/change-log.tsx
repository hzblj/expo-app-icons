import {AppIcon, type AppIconName} from '@hzblj/expo-app-icons'
import {createContext, type ReactNode, use, useEffect, useState} from 'react'

export type Change = {
  /** Which change of this session it was, from 1. */
  count: number
  name: AppIconName
  /** When the listener heard it. */
  time: Date
}

/** As many changes as the log keeps, newest first. */
const KEEP = 5

const ChangeLog = createContext<Change[]>([])

/**
 * One `AppIcon.addChangeListener` for the whole app, from launch, so the log on the API tab has every change made on
 * any tab, not only those made while it was open.
 */
export const ChangeLogProvider = ({children}: {children: ReactNode}) => {
  const [changes, setChanges] = useState<Change[]>([])

  useEffect(() => {
    const subscription = AppIcon.addChangeListener(name =>
      setChanges(current => [{count: (current[0]?.count ?? 0) + 1, name, time: new Date()}, ...current].slice(0, KEEP))
    )

    return () => subscription.remove()
  }, [])

  return <ChangeLog value={changes}>{children}</ChangeLog>
}

/** The changes the app's listener heard this session, newest first. */
export const useChangeLog = () => use(ChangeLog)
