package com.hzblj.expoappicons

import android.content.Context
import android.os.Handler
import android.os.Looper
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.ProcessLifecycleOwner
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlin.concurrent.thread

class ExpoAppIconsModule : Module() {
  private val context: Context
    get() = (appContext.reactContext ?: throw Exceptions.ReactContextLost()).applicationContext

  private val switcher: AppIconSwitcher by lazy { AppIconSwitcher(context) }

  private val mainHandler = Handler(Looper.getMainLooper())

  private val backgroundObserver = object : DefaultLifecycleObserver {
    override fun onStop(owner: LifecycleOwner) {
      thread(name = "ExpoAppIcons") { switcher.applyPending() }
    }
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoAppIcons")

    OnCreate {
      thread(name = "ExpoAppIcons") { switcher.repair() }
      mainHandler.post { ProcessLifecycleOwner.get().lifecycle.addObserver(backgroundObserver) }
    }

    OnDestroy {
      mainHandler.post { ProcessLifecycleOwner.get().lifecycle.removeObserver(backgroundObserver) }
    }

    Function("isSupported") { switcher.isSupported() }

    Function("getAlternateIcons") { switcher.alternateIcons() }

    AsyncFunction("getIcon") { switcher.desiredIcon() }

    AsyncFunction("setIcon") { name: String -> switcher.schedule(name) }
  }
}
