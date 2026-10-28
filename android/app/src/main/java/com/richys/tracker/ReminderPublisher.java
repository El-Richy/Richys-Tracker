package com.richys.tracker;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class ReminderPublisher extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();
        if (Intent.ACTION_BOOT_COMPLETED.equals(action)
            || Intent.ACTION_LOCKED_BOOT_COMPLETED.equals(action)
            || "android.intent.action.QUICKBOOT_POWERON".equals(action)) {
            ReminderStore.restoreAll(context);
            return;
        }
        if (!ReminderStore.ACTION_FIRE.equals(action)) return;
        int id = intent.getIntExtra("id", -1);
        if (id < 0) return;
        String title = intent.getStringExtra("title");
        String body = intent.getStringExtra("body");
        int hour = intent.getIntExtra("hour", 0);
        int minute = intent.getIntExtra("minute", 0);
        if (title == null) title = "Richy's Tracker";
        if (body == null) body = "";
        ReminderStore.show(context, id, title, body);
        ReminderStore.scheduleAlarm(context, id, title, body, hour, minute);
    }
}
