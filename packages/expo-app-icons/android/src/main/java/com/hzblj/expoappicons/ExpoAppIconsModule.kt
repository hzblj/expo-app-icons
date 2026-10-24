package com.hzblj.expoappicons

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.ProcessLifecycleOwner
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlin.concurrent.thread

private const val TAG = "ExpoAppIcons"

class ExpoAppIconsModule : Module() {
  private val context: Context
    get() = (appContext.reactContext ?: throw Exceptions.ReactContextLost()).applicationContext

  private val switcher: AppIconSwitcher by lazy { AppIconSwitcher(context) }

  private val mainHandler = Handler(Looper.getMainLooper())

  private val backgroundObserver = object : DefaultLifecycleObserver {
    override fun onStop(owner: LifecycleOwner) {
      runInBackground("applyPending") { switcher.applyPending() }
    }
  }

  private fun runInBackground(name: String, block: () -> Unit) {
    thread(name = TAG) {
      runCatching(block).onFailure { Log.w(TAG, "$name failed", it) }
    }
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoAppIcons")

    OnCreate {
      runInBackground("repair") { switcher.repair() }
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
