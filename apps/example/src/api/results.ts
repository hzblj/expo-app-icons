import type {AppIconChange} from '@hzblj/expo-app-icons'

/** What each result of `setIcon` means, in the README's words. */
export const RESULTS: Record<AppIconChange, string> = {
  changed:
    'Applied: the home screen shows it now. iOS answers it after its alert, Android when the choice undoes one still scheduled.',
  scheduled: 'Stored: Android applies it when the app goes to the background.',
  unchanged: 'It was already the selected icon.',
  unsupported: 'No native module, or a build without alternates.',
}

/** The order the README lists them in. */
export const RESULT_ORDER: AppIconChange[] = ['changed', 'scheduled', 'unchanged', 'unsupported']
