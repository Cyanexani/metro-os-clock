package com.anonymous.testmetroospivot

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import android.widget.RemoteViews
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Metro Clock home-screen widget.
 *
 * Updates every minute via a minute-aligned AlarmManager (exact alarm on API 31+,
 * inexact on older). The system's updatePeriodMillis=60000 in the provider XML is a
 * fallback; AlarmManager gives sub-minute accuracy.
 *
 * Tapping the widget opens the main app.
 */
class ClockWidgetProvider : AppWidgetProvider() {

    companion object {
        private const val ACTION_UPDATE = "com.anonymous.testmetroospivot.WIDGET_UPDATE"
        private val timeFmt12 = SimpleDateFormat("h:mm", Locale.getDefault())
        private val ampmFmt  = SimpleDateFormat("a", Locale.getDefault())
        private val dateFmt  = SimpleDateFormat("EEE, MMM d", Locale.getDefault())

        /** Push a fresh time to all widgets. */
        fun updateAll(context: Context) {
            val mgr = AppWidgetManager.getInstance(context)
            val ids = mgr.getAppWidgetIds(
                ComponentName(context, ClockWidgetProvider::class.java)
            )
            if (ids.isEmpty()) return

            val now   = Date()
            val time  = timeFmt12.format(now)
            val ampm  = ampmFmt.format(now).uppercase()
            val date  = dateFmt.format(now)

            val views = RemoteViews(context.packageName, R.layout.widget_clock)
            views.setTextViewText(R.id.widget_time, time)
            views.setTextViewText(R.id.widget_date, "$ampm · $date")

            // Tap → open app
            val launch = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val pi = PendingIntent.getActivity(
                context, 0, launch,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_time, pi)
            views.setOnClickPendingIntent(R.id.widget_date, pi)

            mgr.updateAppWidget(ids, views)
        }

        /** Schedule the next exact-minute tick. */
        fun scheduleNextTick(context: Context) {
            val intent = Intent(context, ClockWidgetProvider::class.java).apply {
                action = ACTION_UPDATE
            }
            val pi = PendingIntent.getBroadcast(
                context, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

            // Align to the next full minute so the clock turns exactly on :00
            val now = System.currentTimeMillis()
            val nextMinute = now - (now % 60_000) + 60_000

            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && am.canScheduleExactAlarms()) {
                    am.setExactAndAllowWhileIdle(AlarmManager.RTC, nextMinute, pi)
                } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    am.setExactAndAllowWhileIdle(AlarmManager.RTC, nextMinute, pi)
                } else {
                    am.setExact(AlarmManager.RTC, nextMinute, pi)
                }
            } catch (e: SecurityException) {
                // Exact alarm permission not granted; fall back to inexact
                am.set(AlarmManager.RTC, nextMinute, pi)
            }
        }

        fun cancelTick(context: Context) {
            val intent = Intent(context, ClockWidgetProvider::class.java).apply {
                action = ACTION_UPDATE
            }
            val pi = PendingIntent.getBroadcast(
                context, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            (context.getSystemService(Context.ALARM_SERVICE) as AlarmManager).cancel(pi)
        }
    }

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        updateAll(context)
        scheduleNextTick(context)
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == ACTION_UPDATE ||
            intent.action == Intent.ACTION_TIME_TICK ||
            intent.action == Intent.ACTION_TIME_CHANGED ||
            intent.action == Intent.ACTION_TIMEZONE_CHANGED
        ) {
            updateAll(context)
            scheduleNextTick(context)
        }
    }

    override fun onEnabled(context: Context) {
        updateAll(context)
        scheduleNextTick(context)
    }

    override fun onDisabled(context: Context) {
        cancelTick(context)
    }
}
