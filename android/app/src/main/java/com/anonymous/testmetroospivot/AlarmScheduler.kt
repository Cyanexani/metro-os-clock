package com.anonymous.testmetroospivot

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import org.json.JSONArray
import org.json.JSONObject
import java.util.Calendar

object AlarmScheduler {
    private const val PREFS = "metro_native_alarms"
    private const val KEY_ALARMS = "alarms"
    private const val KEY_FIRED = "fired_ids"
    private const val TIMER_ID = "__metro_timer__"

    // The countdown timer reuses the alarm ring pipeline (receiver → foreground
    // service → full-screen activity) so it also fires on the lock screen.
    fun scheduleTimer(context: Context, triggerAt: Long) {
        scheduleAt(context, timerJson(), triggerAt, false)
    }

    fun cancelTimer(context: Context) {
        val manager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        manager.cancel(alarmPendingIntent(context, timerJson(), false))
    }

    private fun timerJson(): JSONObject = JSONObject().apply {
        put("id", TIMER_ID)
        put("name", "timer")
        put("snooze", false)
        put("isTimer", true)
        put("repeat", JSONArray())
    }

    fun sync(context: Context, json: String) {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        cancelStored(context, prefs.getString(KEY_ALARMS, "[]") ?: "[]")
        prefs.edit().putString(KEY_ALARMS, json).apply()

        val alarms = JSONArray(json)
        for (index in 0 until alarms.length()) {
            val alarm = alarms.getJSONObject(index)
            if (alarm.optBoolean("enabled", true)) schedule(context, alarm, false)
        }
    }

    fun restore(context: Context) {
        val json = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getString(KEY_ALARMS, "[]") ?: "[]"
        val alarms = JSONArray(json)
        for (index in 0 until alarms.length()) {
            val alarm = alarms.getJSONObject(index)
            if (alarm.optBoolean("enabled", true)) schedule(context, alarm, false)
        }
    }

    fun markFired(context: Context, alarmId: String) {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val fired = prefs.getStringSet(KEY_FIRED, emptySet())?.toMutableSet() ?: mutableSetOf()
        fired.add(alarmId)
        prefs.edit().putStringSet(KEY_FIRED, fired).apply()
    }

    fun consumeFired(context: Context): Set<String> {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val fired = prefs.getStringSet(KEY_FIRED, emptySet())?.toSet() ?: emptySet()
        prefs.edit().remove(KEY_FIRED).apply()
        return fired
    }

    fun scheduleNextRepeat(context: Context, alarmId: String) {
        val json = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getString(KEY_ALARMS, "[]") ?: "[]"
        val alarms = JSONArray(json)
        for (index in 0 until alarms.length()) {
            val alarm = alarms.getJSONObject(index)
            if (alarm.optString("id") == alarmId && alarm.optJSONArray("repeat")?.length() ?: 0 > 0) {
                schedule(context, alarm, false)
                return
            }
        }
    }

    fun scheduleSnooze(context: Context, source: Intent, delayMinutes: Int = 5) {
        val alarm = JSONObject().apply {
            put("id", source.getStringExtra("alarmId") ?: "snooze")
            put("name", source.getStringExtra("alarmName") ?: "Alarm")
            put("hour24", source.getIntExtra("hour24", 0))
            put("minute", source.getIntExtra("minute", 0))
            put("sound", source.getStringExtra("sound") ?: "")
            put("snooze", true)
            put("repeat", JSONArray())
        }
        scheduleAt(context, alarm, System.currentTimeMillis() + delayMinutes * 60_000L, true)
    }

    private fun schedule(context: Context, alarm: JSONObject, snooze: Boolean) {
        scheduleAt(context, alarm, nextTrigger(alarm), snooze)
    }

    private fun scheduleAt(context: Context, alarm: JSONObject, triggerAt: Long, snooze: Boolean) {
        val manager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val pending = alarmPendingIntent(context, alarm, snooze)
        try {
            when {
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && manager.canScheduleExactAlarms() ->
                    manager.setAlarmClock(AlarmManager.AlarmClockInfo(triggerAt, pending), pending)
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ->
                    manager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pending)
                else -> manager.setExact(AlarmManager.RTC_WAKEUP, triggerAt, pending)
            }
        } catch (_: SecurityException) {
            manager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pending)
        }
    }

    private fun nextTrigger(alarm: JSONObject): Long {
        val now = Calendar.getInstance()
        val repeat = alarm.optJSONArray("repeat") ?: JSONArray()
        val allowedDays = mutableSetOf<Int>()
        for (index in 0 until repeat.length()) {
            allowedDays.add(dayToCalendar(repeat.optString(index)))
        }

        for (daysAhead in 0..7) {
            val candidate = Calendar.getInstance().apply {
                add(Calendar.DAY_OF_YEAR, daysAhead)
                set(Calendar.HOUR_OF_DAY, alarm.optInt("hour24", 0))
                set(Calendar.MINUTE, alarm.optInt("minute", 0))
                set(Calendar.SECOND, 0)
                set(Calendar.MILLISECOND, 0)
            }
            val dayMatches = allowedDays.isEmpty() || allowedDays.contains(candidate.get(Calendar.DAY_OF_WEEK))
            if (dayMatches && candidate.after(now)) return candidate.timeInMillis
        }

        return now.timeInMillis + 24 * 60 * 60 * 1000L
    }

    private fun dayToCalendar(day: String): Int = when (day) {
        "Sun" -> Calendar.SUNDAY
        "Mon" -> Calendar.MONDAY
        "Tue" -> Calendar.TUESDAY
        "Wed" -> Calendar.WEDNESDAY
        "Thu" -> Calendar.THURSDAY
        "Fri" -> Calendar.FRIDAY
        "Sat" -> Calendar.SATURDAY
        else -> -1
    }

    private fun alarmPendingIntent(context: Context, alarm: JSONObject, snooze: Boolean): PendingIntent {
        val id = alarm.optString("id", "alarm")
        val repeat = alarm.optJSONArray("repeat") ?: JSONArray()
        val intent = Intent(context, AlarmReceiver::class.java).apply {
            action = if (snooze) "${context.packageName}.ALARM_SNOOZE" else "${context.packageName}.ALARM_FIRE"
            putExtra("alarmId", id)
            putExtra("alarmName", alarm.optString("name", "Alarm"))
            putExtra("hour24", alarm.optInt("hour24", 0))
            putExtra("minute", alarm.optInt("minute", 0))
            putExtra("sound", alarm.optString("sound", ""))
            putExtra("snooze", alarm.optBoolean("snooze", true))
            putExtra("repeating", repeat.length() > 0)
            putExtra("isTimer", alarm.optBoolean("isTimer", false))
        }
        val requestCode = (id + if (snooze) ":snooze" else ":alarm").hashCode()
        return PendingIntent.getBroadcast(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    }

    private fun cancelStored(context: Context, json: String) {
        val manager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val alarms = try { JSONArray(json) } catch (_: Exception) { JSONArray() }
        for (index in 0 until alarms.length()) {
            val alarm = alarms.getJSONObject(index)
            manager.cancel(alarmPendingIntent(context, alarm, false))
            manager.cancel(alarmPendingIntent(context, alarm, true))
        }
    }
}
