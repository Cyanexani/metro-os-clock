package com.anonymous.testmetroospivot

import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Bundle
import android.view.Gravity
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

class AlarmRingingActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                    WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
                    WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD,
            )
        }
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        setContentView(buildContent())
    }

    private fun buildContent(): LinearLayout {
        val density = resources.displayMetrics.density
        val hour = intent.getIntExtra("hour24", 0)
        val minute = intent.getIntExtra("minute", 0)
        val time = String.format("%02d:%02d", hour, minute)

        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding((24 * density).toInt(), 0, (24 * density).toInt(), 0)
            setBackgroundColor(Color.rgb(0, 74, 135))

            addView(TextView(context).apply {
                text = intent.getStringExtra("alarmName") ?: "Alarm"
                setTextColor(Color.WHITE)
                textSize = 22f
                gravity = Gravity.CENTER
                typeface = Typeface.create("sans-serif", Typeface.NORMAL)
            })
            addView(TextView(context).apply {
                text = time
                setTextColor(Color.WHITE)
                textSize = 76f
                gravity = Gravity.CENTER
                typeface = Typeface.create("sans-serif-light", Typeface.NORMAL)
                setPadding(0, (8 * density).toInt(), 0, (52 * density).toInt())
            })
            addView(LinearLayout(context).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER
                if (intent.getBooleanExtra("snooze", true)) {
                    addView(alarmButton("snooze", AlarmRingService.ACTION_SNOOZE))
                }
                addView(alarmButton("dismiss", AlarmRingService.ACTION_DISMISS))
            })
        }
    }

    private fun alarmButton(label: String, actionName: String): Button = Button(this).apply {
        text = label
        setTextColor(Color.WHITE)
        textSize = 18f
        background = GradientDrawable().apply {
            setColor(Color.TRANSPARENT)
            setStroke((2 * resources.displayMetrics.density).toInt(), Color.WHITE)
        }
        minWidth = (128 * resources.displayMetrics.density).toInt()
        val margin = (8 * resources.displayMetrics.density).toInt()
        layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT,
            LinearLayout.LayoutParams.WRAP_CONTENT,
        ).apply { setMargins(margin, 0, margin, 0) }
        setOnClickListener {
            startService(Intent(this@AlarmRingingActivity, AlarmRingService::class.java).apply {
                action = actionName
            })
            finish()
        }
    }
}
