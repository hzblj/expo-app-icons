---
"@hzblj/expo-app-icons": patch
---

Android no longer crashes the app when applying a scheduled icon or repairing the launcher aliases fails in the background; the failure is logged instead. Switching to the icon that is already set no longer calls `setComponentEnabledSettings` with an empty list, which throws on Android 13 and later.
