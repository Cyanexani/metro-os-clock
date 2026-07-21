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
}
