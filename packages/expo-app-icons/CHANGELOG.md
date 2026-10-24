# @hzblj/expo-app-icons

## 0.1.1

### Patch Changes

- [`2f8f7a4`](https://github.com/hzblj/expo-app-icons/commit/2f8f7a4a5effeb2488fbdd52cf9dc8f74891bdab) Thanks [@hzblj](https://github.com/hzblj)! - Android no longer crashes the app when applying a scheduled icon or repairing the launcher aliases fails in the background; the failure is logged instead. Switching to the icon that is already set no longer calls `setComponentEnabledSettings` with an empty list, which throws on Android 13 and later.
