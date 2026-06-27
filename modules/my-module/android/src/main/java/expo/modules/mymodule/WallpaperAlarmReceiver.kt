package expo.modules.mymodule

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Fired by AlarmManager at a scheduled time — even if the app process is dead.
 * Applies the wallpaper off the main thread, then re-arms the next occurrence.
 */
class WallpaperAlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val path = intent.getStringExtra("localPath") ?: return
    val target = intent.getStringExtra("target") ?: "both"
    val id = intent.getStringExtra("id") ?: return
    val repeat = intent.getStringExtra("repeat") ?: "daily"

    val pending = goAsync()
    Thread {
      try {
        WallpaperScheduler.applyWallpaper(context, path, target)
        WallpaperScheduler.onFired(context, id, repeat)
      } finally {
        pending.finish()
      }
    }.start()
  }
}
