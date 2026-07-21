package com.anonymous.testmetroospivot

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class MetroAlarmModule(private val context: ReactApplicationContext) :
    ReactContextBaseJavaModule(context) {
    override fun getName(): String = "MetroAlarm"

    @ReactMethod
    fun syncAlarms(json: String, promise: Promise) {
        try {
            AlarmScheduler.sync(context, json)
            promise.resolve(true)
        } catch (error: Exception) {
            promise.reject("ALARM_SYNC_FAILED", error)
        }
    }

    @ReactMethod
    fun consumeFiredAlarmIds(promise: Promise) {
        val result = Arguments.createArray()
        AlarmScheduler.consumeFired(context).forEach { result.pushString(it) }
        promise.resolve(result)
    }

    // Countdown timer rides the same AlarmManager pipeline as alarms so it
    // rings on the lock screen / with the app killed.
    @ReactMethod
    fun scheduleTimer(triggerAtMs: Double, promise: Promise) {
        try {
            AlarmScheduler.scheduleTimer(context, triggerAtMs.toLong())
            promise.resolve(true)
        } catch (error: Exception) {
            promise.reject("TIMER_SCHEDULE_FAILED", error)
        }
    }

    @ReactMethod
    fun cancelTimer(promise: Promise) {
        try {
            AlarmScheduler.cancelTimer(context)
            promise.resolve(true)
        } catch (error: Exception) {
            promise.reject("TIMER_CANCEL_FAILED", error)
        }
    }

    // Stops the native ring service (used when the user dismisses from the
    // in-app overlay while the app is foregrounded).
    @ReactMethod
    fun stopRinging(promise: Promise) {
        try {
            context.startService(
                android.content.Intent(context, AlarmRingService::class.java).apply {
                    action = AlarmRingService.ACTION_DISMISS
                }
            )
            promise.resolve(true)
        } catch (error: Exception) {
            promise.reject("STOP_RINGING_FAILED", error)
        }
    }

    // Android 14+ can deny USE_FULL_SCREEN_INTENT, silently downgrading the
    // lock-screen ringing page to a plain heads-up notification. Expose the
    // check + the settings page so the app can walk the user through it.
    @ReactMethod
    fun canUseFullScreenIntent(promise: Promise) {
        val granted = if (android.os.Build.VERSION.SDK_INT >= 34) {
            val manager = context.getSystemService(android.content.Context.NOTIFICATION_SERVICE)
                as android.app.NotificationManager
            manager.canUseFullScreenIntent()
        } else {
            true
        }
        promise.resolve(granted)
    }

    @ReactMethod
    fun openFullScreenIntentSettings(promise: Promise) {
        try {
            val intent = if (android.os.Build.VERSION.SDK_INT >= 34) {
                android.content.Intent(
                    android.provider.Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT,
                    android.net.Uri.parse("package:${context.packageName}"),
                )
            } else {
                android.content.Intent(
                    android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                    android.net.Uri.parse("package:${context.packageName}"),
                )
            }.apply { addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK) }
            context.startActivity(intent)
            promise.resolve(true)
        } catch (error: Exception) {
            promise.reject("OPEN_FSI_SETTINGS_FAILED", error)
        }
    }
}
