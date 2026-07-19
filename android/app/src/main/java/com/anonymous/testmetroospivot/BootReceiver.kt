package com.anonymous.testmetroospivot

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Fires on BOOT_COMPLETED and QUICKBOOT_POWERON.
 * Restarts the widget's minute-tick AlarmManager so the clock widget
 * stays live after a reboot without waiting for the user to open the app.
 */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED ||
            intent.action == "android.intent.action.QUICKBOOT_POWERON"
        ) {
            // Restart the widget minute-tick
            ClockWidgetProvider.updateAll(context)
            ClockWidgetProvider.scheduleNextTick(context)
        }
    }
}
