package expo.modules.mymodule

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Exact alarms do not survive a reboot. On BOOT_COMPLETED we re-arm every
 * persisted wallpaper schedule from SharedPreferences.
 */
class BootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
      val pending = goAsync()
      Thread {
        try {
          WallpaperScheduler.rearmAll(context)
        } finally {
          pending.finish()
        }
      }.start()
    }
  }
}
