declare module 'xcode' {
  import type {XcodeProject} from 'expo/config-plugins'
  export const project: (path: string) => XcodeProject
}
