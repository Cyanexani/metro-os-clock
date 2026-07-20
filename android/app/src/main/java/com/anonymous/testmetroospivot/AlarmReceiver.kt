package com.anonymous.testmetroospivot

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build

class AlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val serviceIntent = Intent(context, AlarmRingService::class.java).apply {
            action = AlarmRingService.ACTION_START
            putExtras(intent.extras ?: return)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent)
        } else {
            context.startService(serviceIntent)
        }

        if (intent.getBooleanExtra("repeating", false)) {
            AlarmScheduler.scheduleNextRepeat(context, intent.getStringExtra("alarmId") ?: return)
        } else if (intent.action?.endsWith("ALARM_SNOOZE") != true) {
            AlarmScheduler.markFired(context, intent.getStringExtra("alarmId") ?: return)
        }
    }
}
