package expo.modules.mymodule

import android.accessibilityservice.AccessibilityService
import android.view.accessibility.AccessibilityEvent
import android.content.Intent
import android.content.Context
import android.content.SharedPreferences
import android.util.Log

class AppBlockerService : AccessibilityService() {

    // We will read the list of distracting apps dynamically from SharedPreferences

    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        if (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            val packageName = event.packageName?.toString() ?: return
            
            val prefs = getSharedPreferences("ChronosPrefs", Context.MODE_PRIVATE)
            val isBlocked = prefs.getBoolean("isDailyLogPending", false)
            
            val joinedPackages = prefs.getString("blockedPackages", "") ?: ""
            val dynamicBlockedPackages = if (joinedPackages.isEmpty()) emptyList() else joinedPackages.split(",")

            if (isBlocked && dynamicBlockedPackages.contains(packageName)) {
                Log.d("AppBlocker", "Blocked app launched: $packageName, redirecting to Chronos")
                // Launch Chronos to redirect (NOT the blocked app)
                val ChronosPackage = applicationContext.packageName
                val redirectIntent = packageManager.getLaunchIntentForPackage(ChronosPackage)
                if (redirectIntent != null) {
                    redirectIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                    startActivity(redirectIntent)
                }
            }
        }
    }

    override fun onInterrupt() {
        // Required, but we don't need to do anything here
    }
}
