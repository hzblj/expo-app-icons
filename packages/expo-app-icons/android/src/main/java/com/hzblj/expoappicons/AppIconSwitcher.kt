package com.hzblj.expoappicons

import android.content.ComponentName
import android.content.Context
import android.content.pm.PackageInfo
import android.content.pm.PackageManager
import android.os.Build

private const val DEFAULT_ICON = "default"
private const val ICON_NAME_META_DATA = "com.hzblj.expoappicons.NAME"
private const val PREFERENCES_NAME = "com.hzblj.expoappicons"
private const val PENDING_ICON_KEY = "pendingIcon"

private data class AppIconAlias(val name: String, val component: ComponentName) {
  val isEnabledInManifest: Boolean
    get() = name == DEFAULT_ICON
}

internal class AppIconSwitcher(private val context: Context) {
  private val packageManager = context.packageManager
  private val preferences = context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)
  private val aliases: List<AppIconAlias> by lazy { readAliases() }

  fun isSupported() = aliases.size > 1 && aliases.any { it.name == DEFAULT_ICON }

  fun alternateIcons() = aliases.map { it.name }.filter { it != DEFAULT_ICON }.sorted()

  @Synchronized
  fun desiredIcon() = pendingIcon() ?: currentIcon()

  @Synchronized
  fun schedule(name: String): String {
    if (aliases.none { it.name == name }) {
      throw UnknownAppIconException(name)
    }

    if (desiredIcon() == name) {
      return "unchanged"
    }

    if (currentIcon() == name) {
      clearPending()
      return "changed"
    }

    preferences.edit().putString(PENDING_ICON_KEY, name).apply()
    return "scheduled"
  }

  @Synchronized
  fun applyPending() {
    val name = pendingIcon() ?: return

    if (aliases.any { it.name == name }) {
      enableOnly(name)
    }

    clearPending()
  }

  @Synchronized
  fun repair() {
    if (aliases.isEmpty()) {
      return
    }

    val pending = pendingIcon()

    if (pending != null && aliases.none { it.name == pending }) {
      clearPending()
    }

    if (aliases.none(::isEnabled)) {
      enableOnly(DEFAULT_ICON)
    }
  }

  private fun currentIcon(): String {
    val enabled = aliases.filter(::isEnabled)

    return (enabled.firstOrNull { it.name != DEFAULT_ICON } ?: enabled.firstOrNull())?.name ?: DEFAULT_ICON
  }

  private fun pendingIcon() = preferences.getString(PENDING_ICON_KEY, null)

  private fun clearPending() {
    preferences.edit().remove(PENDING_ICON_KEY).apply()
  }

  private fun isEnabled(alias: AppIconAlias) =
    when (packageManager.getComponentEnabledSetting(alias.component)) {
      PackageManager.COMPONENT_ENABLED_STATE_ENABLED -> true
      PackageManager.COMPONENT_ENABLED_STATE_DEFAULT -> alias.isEnabledInManifest
      else -> false
    }

  private fun enableOnly(name: String) {
    val changes = aliases
      .sortedByDescending { it.name == name }
      .map { it.component to enabledState(it, it.name == name) }
      .filter { (component, state) -> packageManager.getComponentEnabledSetting(component) != state }

    if (changes.isEmpty()) {
      return
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      packageManager.setComponentEnabledSettings(
        changes.map { (component, state) ->
          PackageManager.ComponentEnabledSetting(component, state, PackageManager.DONT_KILL_APP)
        }
      )
      return
    }

    for ((component, state) in changes) {
      packageManager.setComponentEnabledSetting(component, state, PackageManager.DONT_KILL_APP)
    }
  }

  private fun enabledState(alias: AppIconAlias, isEnabled: Boolean) =
    when {
      isEnabled == alias.isEnabledInManifest -> PackageManager.COMPONENT_ENABLED_STATE_DEFAULT
      isEnabled -> PackageManager.COMPONENT_ENABLED_STATE_ENABLED
      else -> PackageManager.COMPONENT_ENABLED_STATE_DISABLED
    }

  private fun readAliases(): List<AppIconAlias> {
    val flags = PackageManager.GET_ACTIVITIES or PackageManager.GET_META_DATA or PackageManager.MATCH_DISABLED_COMPONENTS
    val packageInfo: PackageInfo =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        packageManager.getPackageInfo(context.packageName, PackageManager.PackageInfoFlags.of(flags.toLong()))
      } else {
        @Suppress("DEPRECATION")
        packageManager.getPackageInfo(context.packageName, flags)
      }

    return packageInfo.activities.orEmpty().mapNotNull { activity ->
      val name = activity.metaData?.getString(ICON_NAME_META_DATA)

      if (name == null || activity.targetActivity == null) {
        null
      } else {
        AppIconAlias(name, ComponentName(context.packageName, activity.name))
      }
    }
  }
}
