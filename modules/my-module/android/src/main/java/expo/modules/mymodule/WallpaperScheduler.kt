package expo.modules.mymodule

import android.app.AlarmManager
import android.app.PendingIntent
import android.app.WallpaperManager
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Build
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.util.Calendar

/**
 * Owns scheduled wallpaper changes via AlarmManager exact alarms so they fire to
 * the minute even when the app is killed. JS pushes the full schedule down via
 * MyModule.syncWallpaperSchedules; native persists it and (re)arms one alarm per
 * entry. WallpaperAlarmReceiver applies and re-arms; BootReceiver re-arms after a
 * reboot.
 */
object WallpaperScheduler {
  private const val PREFS = "ChronosPrefs"
  private const val KEY_SCHEDULES = "wallpaperSchedules"
  private const val KEY_ARMED_IDS = "wallpaperArmedIds"
  const val ACTION_APPLY = "expo.modules.mymodule.APPLY_WALLPAPER"

  fun saveAndArm(context: Context, json: String) {
    prefs(context).edit().putString(KEY_SCHEDULES, json).apply()
    rearmAll(context)
  }

  fun rearmAll(context: Context) {
    val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

    val prevIds = prefs(context).getString(KEY_ARMED_IDS, "") ?: ""
    if (prevIds.isNotEmpty()) {
      for (id in prevIds.split(",")) {
        if (id.isNotEmpty()) am.cancel(cancelIntent(context, id))
      }
    }

    val arr = readSchedules(context)
    val armed = mutableListOf<String>()
    for (i in 0 until arr.length()) {
      val o = arr.getJSONObject(i)
      if (armOne(context, am, o)) armed.add(o.getString("id"))
    }
    prefs(context).edit().putString(KEY_ARMED_IDS, armed.joinToString(",")).apply()
  }

  private fun armOne(context: Context, am: AlarmManager, o: JSONObject): Boolean {
    val triggerAt = nextTrigger(
      o.getString("time"),
      o.optString("repeat", "daily"),
      o.optJSONArray("weekdays")
    ) ?: return false

    val pi = applyPendingIntent(context, o)
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pi)
      } else {
        am.setExact(AlarmManager.RTC_WAKEUP, triggerAt, pi)
      }
    } catch (e: SecurityException) {
      // Exact-alarm permission not granted; JS surfaces a banner to fix this.
      return false
    }
    return true
  }

  /** Called by the receiver after an alarm fires. */
  fun onFired(context: Context, id: String, repeat: String) {
    if (repeat == "once") {
      val arr = readSchedules(context)
      val next = JSONArray()
      for (i in 0 until arr.length()) {
        val o = arr.getJSONObject(i)
        if (o.getString("id") != id) next.put(o)
      }
      prefs(context).edit().putString(KEY_SCHEDULES, next.toString()).apply()
    }
    rearmAll(context)
  }

  fun applyWallpaper(context: Context, pathOrUri: String, target: String): Boolean {
    val bitmap = decode(context, pathOrUri) ?: return false
    val wm = WallpaperManager.getInstance(context)
    val sys = WallpaperManager.FLAG_SYSTEM
    val lock = WallpaperManager.FLAG_LOCK
    return try {
      when (target) {
        "home" -> wm.setBitmap(bitmap, null, true, sys)
        "lock" -> wm.setBitmap(bitmap, null, true, lock)
        else -> wm.setBitmap(bitmap, null, true, sys or lock)
      }
      true
    } catch (e: Exception) {
      false
    }
  }

  /** Copies a picked image into app-private storage and returns the absolute path. */
  fun importImage(context: Context, srcUri: String): String? {
    return try {
      val uri = toUri(srcUri)
      val dir = File(context.filesDir, "wallpapers").apply { mkdirs() }
      val dest = File(dir, "wp-${System.currentTimeMillis()}.img")
      context.contentResolver.openInputStream(uri).use { input ->
        dest.outputStream().use { output -> input?.copyTo(output) }
      }
      dest.absolutePath
    } catch (e: Exception) {
      null
    }
  }

  fun removeFile(path: String) {
    try {
      File(path.removePrefix("file://")).delete()
    } catch (e: Exception) {
    }
  }

  private fun decode(context: Context, pathOrUri: String): Bitmap? {
    return try {
      context.contentResolver.openInputStream(toUri(pathOrUri)).use {
        BitmapFactory.decodeStream(it)
      }
    } catch (e: Exception) {
      try {
        BitmapFactory.decodeFile(pathOrUri.removePrefix("file://"))
      } catch (e2: Exception) {
        null
      }
    }
  }

  private fun toUri(pathOrUri: String): Uri {
    return if (pathOrUri.startsWith("content://") || pathOrUri.startsWith("file://")) {
      Uri.parse(pathOrUri)
    } else {
      Uri.fromFile(File(pathOrUri))
    }
  }

  private fun nextTrigger(time: String, repeat: String, weekdays: JSONArray?): Long? {
    val parts = time.split(":")
    if (parts.size != 2) return null
    val hour = parts[0].toIntOrNull() ?: return null
    val minute = parts[1].toIntOrNull() ?: return null

    val cal = Calendar.getInstance()
    val now = System.currentTimeMillis()
    cal.set(Calendar.HOUR_OF_DAY, hour)
    cal.set(Calendar.MINUTE, minute)
    cal.set(Calendar.SECOND, 0)
    cal.set(Calendar.MILLISECOND, 0)
    if (cal.timeInMillis <= now + 1000) {
      cal.add(Calendar.DAY_OF_YEAR, 1)
    }

    if (repeat == "weekdays" && weekdays != null && weekdays.length() > 0) {
      val allowed = mutableSetOf<Int>()
      for (i in 0 until weekdays.length()) allowed.add(weekdays.getInt(i))
      var guard = 0
      // Calendar.DAY_OF_WEEK: Sunday=1..Saturday=7 -> our 0..6 is (dow-1)
      while (!allowed.contains(cal.get(Calendar.DAY_OF_WEEK) - 1) && guard < 8) {
        cal.add(Calendar.DAY_OF_YEAR, 1)
        guard++
      }
    }
    return cal.timeInMillis
  }

  private fun applyPendingIntent(context: Context, o: JSONObject): PendingIntent {
    val id = o.getString("id")
    val intent = Intent(context, WallpaperAlarmReceiver::class.java).apply {
      action = ACTION_APPLY
      data = Uri.parse("chronos://wallpaper/$id")
      putExtra("id", id)
      putExtra("localPath", o.getString("localPath"))
      putExtra("target", o.getString("target"))
      putExtra("repeat", o.optString("repeat", "daily"))
    }
    return PendingIntent.getBroadcast(context, id.hashCode(), intent, flags())
  }

  private fun cancelIntent(context: Context, id: String): PendingIntent {
    val intent = Intent(context, WallpaperAlarmReceiver::class.java).apply {
      action = ACTION_APPLY
      data = Uri.parse("chronos://wallpaper/$id")
    }
    return PendingIntent.getBroadcast(context, id.hashCode(), intent, flags())
  }

  private fun flags(): Int {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    } else {
      PendingIntent.FLAG_UPDATE_CURRENT
    }
  }

  private fun readSchedules(context: Context): JSONArray {
    val json = prefs(context).getString(KEY_SCHEDULES, "[]") ?: "[]"
    return try {
      JSONArray(json)
    } catch (e: Exception) {
      JSONArray()
    }
  }

  private fun prefs(context: Context) =
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
}
