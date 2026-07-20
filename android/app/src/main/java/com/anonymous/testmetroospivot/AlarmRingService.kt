package com.anonymous.testmetroospivot

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.os.Build
import android.os.IBinder
import android.os.VibrationEffect
import android.os.Vibrator
import androidx.core.app.NotificationCompat

class AlarmRingService : Service() {
    companion object {
        const val ACTION_START = "com.anonymous.testmetroospivot.START_ALARM"
        const val ACTION_DISMISS = "com.anonymous.testmetroospivot.DISMISS_ALARM"
        const val ACTION_SNOOZE = "com.anonymous.testmetroospivot.SNOOZE_ALARM"
        private const val CHANNEL_ID = "metro_alarm_ringing"
        private const val NOTIFICATION_ID = 7301
    }

    private var player: MediaPlayer? = null
    private var vibrator: Vibrator? = null
    private var activeExtras: Intent? = null

    override fun onCreate() {
        super.onCreate()
        createChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_DISMISS -> stopAlarm()
            ACTION_SNOOZE -> {
                activeExtras?.let { AlarmScheduler.scheduleSnooze(this, it) }
                stopAlarm()
            }
            else -> startAlarm(intent ?: Intent())
        }
        return START_NOT_STICKY
    }

    private fun startAlarm(source: Intent) {
        activeExtras = Intent(source)
        startForeground(NOTIFICATION_ID, buildNotification(source))

        if (player == null) {
            try {
                val uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
                    ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
                player = MediaPlayer().apply {
                    setAudioAttributes(
                        AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_ALARM)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                            .build()
                    )
                    setDataSource(applicationContext, uri)
                    isLooping = true
                    prepare()
                    start()
                }
            } catch (_: Exception) {
                player?.release()
                player = null
            }
        }

        vibrator = getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        val pattern = longArrayOf(0, 700, 500, 700, 500)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator?.vibrate(VibrationEffect.createWaveform(pattern, 0))
        } else {
            @Suppress("DEPRECATION")
            vibrator?.vibrate(pattern, 0)
        }
    }

    private fun buildNotification(source: Intent): Notification {
        val fullScreen = PendingIntent.getActivity(
            this,
            0,
            Intent(this, AlarmRingingActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                putExtras(source.extras ?: android.os.Bundle())
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        val dismiss = servicePendingIntent(ACTION_DISMISS, 1)
        val snooze = servicePendingIntent(ACTION_SNOOZE, 2)

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(source.getStringExtra("alarmName") ?: "Alarm")
            .setContentText("Alarm ringing")
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setOngoing(true)
            .setAutoCancel(false)
            .setFullScreenIntent(fullScreen, true)
            .addAction(0, "Snooze", snooze)
            .addAction(0, "Dismiss", dismiss)
            .build()
    }

    private fun servicePendingIntent(actionName: String, requestCode: Int): PendingIntent =
        PendingIntent.getService(
            this,
            requestCode,
            Intent(this, AlarmRingService::class.java).apply { action = actionName },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

    private fun createChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Ringing alarms",
            NotificationManager.IMPORTANCE_HIGH,
        ).apply {
            description = "Full-screen clock alarms"
            setSound(null, null)
            enableVibration(false)
            lockscreenVisibility = Notification.VISIBILITY_PUBLIC
        }
        (getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
            .createNotificationChannel(channel)
    }

    private fun stopAlarm() {
        player?.run {
            try { stop() } catch (_: Exception) { }
            release()
        }
        player = null
        vibrator?.cancel()
        vibrator = null
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(STOP_FOREGROUND_REMOVE)
        } else {
            @Suppress("DEPRECATION")
            stopForeground(true)
        }
        stopSelf()
    }

    override fun onDestroy() {
        stopAlarm()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
