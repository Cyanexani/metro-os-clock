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
}
