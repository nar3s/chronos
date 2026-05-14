package expo.modules.mymodule

import android.content.Context
import android.content.Intent
import android.accessibilityservice.AccessibilityServiceInfo
import android.provider.Settings
import android.view.accessibility.AccessibilityManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class MyModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("MyModule")

    // 1-arg Function — return@Function Unit is fine here
    Function("setDailyLogPending") { isPending: Boolean ->
      val context = appContext.reactContext ?: return@Function
      val prefs = context.getSharedPreferences("ChronosPrefs", Context.MODE_PRIVATE)
      prefs.edit().putBoolean("isDailyLogPending", isPending).apply()
    }

    Function("setBlockedPackages") { packages: List<String> ->
      val context = appContext.reactContext ?: return@Function
      val prefs = context.getSharedPreferences("ChronosPrefs", Context.MODE_PRIVATE)
      val joined = packages.joinToString(",")
      prefs.edit().putString("blockedPackages", joined).apply()
    }

    Function("getBlockedPackages") {
      val context = appContext.reactContext
      if (context == null) {
        emptyList<String>()
      } else {
        val prefs = context.getSharedPreferences("ChronosPrefs", Context.MODE_PRIVATE)
        val joined = prefs.getString("blockedPackages", "") ?: ""
        if (joined.isEmpty()) emptyList() else joined.split(",")
      }
    }

    // 0-arg Functions — must NOT use return@Function (Unit), must return Any?
    // Use if/else expressions so the last value is Boolean, never Unit.

    Function("isAccessibilityServiceEnabled") {
      val context = appContext.reactContext
      if (context == null) {
        false
      } else {
        val am = context.getSystemService(Context.ACCESSIBILITY_SERVICE) as AccessibilityManager
        am.getEnabledAccessibilityServiceList(AccessibilityServiceInfo.FEEDBACK_ALL_MASK)
          .any { info ->
            info.resolveInfo.serviceInfo.packageName == context.packageName &&
            info.resolveInfo.serviceInfo.name.endsWith("AppBlockerService")
          }
      }
    }

    Function("openAccessibilitySettings") {
      val context = appContext.reactContext
      if (context != null) {
        val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
      }
      true
    }
    Function("hasUsageStatsPermission") {
      val context = appContext.reactContext
      if (context == null) false else {
        val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as android.app.AppOpsManager
        val mode = appOps.checkOpNoThrow(
          android.app.AppOpsManager.OPSTR_GET_USAGE_STATS,
          android.os.Process.myUid(),
          context.packageName
        )
        mode == android.app.AppOpsManager.MODE_ALLOWED
      }
    }

    Function("openUsageStatsSettings") {
      val context = appContext.reactContext
      if (context != null) {
        val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
      }
      true
    }

    Function("getUsageStatsForDate") { timestampMs: Double ->
      val context = appContext.reactContext
      if (context == null) {
        emptyList<Map<String, Any>>()
      } else {
        val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as android.app.usage.UsageStatsManager
        val pm = context.packageManager
        
        val cal = java.util.Calendar.getInstance()
        cal.timeInMillis = timestampMs.toLong()
        cal.set(java.util.Calendar.HOUR_OF_DAY, 0)
        cal.set(java.util.Calendar.MINUTE, 0)
        cal.set(java.util.Calendar.SECOND, 0)
        cal.set(java.util.Calendar.MILLISECOND, 0)
        val startOfDay = cal.timeInMillis
        
        cal.add(java.util.Calendar.DAY_OF_MONTH, 1)
        val endOfDay = cal.timeInMillis

        val usageEvents = usm.queryAndAggregateUsageStats(startOfDay, endOfDay)
        val result = mutableListOf<Map<String, Any>>()
        
        if (usageEvents != null) {
            for ((packageName, stats) in usageEvents) {
                if (stats.totalTimeInForeground > 0) {
                    var appName = stats.packageName
                    try {
                        val appInfo = pm.getApplicationInfo(stats.packageName, 0)
                        appName = pm.getApplicationLabel(appInfo).toString()
                    } catch(e: Exception) {}
                    
                    result.add(mapOf(
                        "packageName" to stats.packageName,
                        "appName" to appName,
                        "timeInForegroundMs" to stats.totalTimeInForeground.toDouble()
                    ))
                }
            }
        }
        result
      }
    }

    Function("getMonthlyUsageStats") { timestampMs: Double ->
      val context = appContext.reactContext
      if (context == null) {
        emptyList<Map<String, Any>>()
      } else {
        val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as android.app.usage.UsageStatsManager
        val pm = context.packageManager
        
        val cal = java.util.Calendar.getInstance()
        cal.timeInMillis = timestampMs.toLong()
        cal.set(java.util.Calendar.DAY_OF_MONTH, 1)
        cal.set(java.util.Calendar.HOUR_OF_DAY, 0)
        cal.set(java.util.Calendar.MINUTE, 0)
        cal.set(java.util.Calendar.SECOND, 0)
        cal.set(java.util.Calendar.MILLISECOND, 0)
        val startOfMonth = cal.timeInMillis
        
        cal.add(java.util.Calendar.MONTH, 1)
        val endOfMonth = cal.timeInMillis

        val usageEvents = usm.queryAndAggregateUsageStats(startOfMonth, endOfMonth)
        val result = mutableListOf<Map<String, Any>>()
        
        if (usageEvents != null) {
            for ((packageName, stats) in usageEvents) {
                if (stats.totalTimeInForeground > 0) {
                    var appName = stats.packageName
                    try {
                        val appInfo = pm.getApplicationInfo(stats.packageName, 0)
                        appName = pm.getApplicationLabel(appInfo).toString()
                    } catch(e: Exception) {}
                    
                    result.add(mapOf(
                        "packageName" to stats.packageName,
                        "appName" to appName,
                        "timeInForegroundMs" to stats.totalTimeInForeground.toDouble()
                    ))
                }
            }
        }
        result
      }
    }
  }
}
