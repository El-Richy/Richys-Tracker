package com.richys.tracker;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.provider.Settings;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import org.json.JSONObject;
import java.util.Calendar;
import java.util.Map;

final class ReminderStore {
    static final String CHANNEL_ID = "richys-reminders";
    static final String ACTION_FIRE = "com.richys.tracker.REMINDER";
    static final int CONFIRM_ID = 2147483630;
    private static final String PREFS = "richys_reminders";

    private ReminderStore() {}

    static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    static void ensureChannel(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager == null) return;
        NotificationChannel channel = new NotificationChannel(
            CHANNEL_ID,
            "Recordatorios",
            NotificationManager.IMPORTANCE_HIGH
        );
        channel.setDescription("Avisos de hábitos y tareas");
        channel.enableVibration(true);
        channel.setLockscreenVisibility(NotificationCompat.VISIBILITY_PUBLIC);
        manager.createNotificationChannel(channel);
    }

    static void save(Context context, int id, String title, String body, int hour, int minute) {
        try {
            JSONObject json = new JSONObject();
            json.put("title", title);
            json.put("body", body);
            json.put("hour", hour);
            json.put("minute", minute);
            prefs(context).edit().putString(String.valueOf(id), json.toString()).apply();
        } catch (Exception ignored) {}
    }

    static void delete(Context context, int id) {
        prefs(context).edit().remove(String.valueOf(id)).apply();
    }

    static void deleteAll(Context context) {
        prefs(context).edit().clear().apply();
    }

    static void scheduleAlarm(Context context, int id, String title, String body, int hour, int minute) {
        AlarmManager alarmManager = context.getSystemService(AlarmManager.class);
        if (alarmManager == null) return;
        long trigger = nextTriggerMillis(hour, minute);
        PendingIntent pending = fireIntent(context, id, title, body, hour, minute, PendingIntent.FLAG_CANCEL_CURRENT);
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !alarmManager.canScheduleExactAlarms()) {
                alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, trigger, pending);
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, trigger, pending);
            } else {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, trigger, pending);
            }
        } catch (SecurityException e) {
            alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, trigger, pending);
        }
    }

    static boolean canExact(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true;
        AlarmManager alarmManager = context.getSystemService(AlarmManager.class);
        return alarmManager == null || alarmManager.canScheduleExactAlarms();
    }

    static void requestExactSettings(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return;
        Intent intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
        intent.setData(android.net.Uri.parse("package:" + context.getPackageName()));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        context.startActivity(intent);
    }

    static void cancelAlarm(Context context, int id) {
        AlarmManager alarmManager = context.getSystemService(AlarmManager.class);
        if (alarmManager == null) return;
        PendingIntent pending = fireIntent(context, id, "", "", 0, 0, PendingIntent.FLAG_NO_CREATE);
        if (pending != null) {
            alarmManager.cancel(pending);
            pending.cancel();
        }
        delete(context, id);
    }

    static void cancelAll(Context context) {
        Map<String, ?> all = prefs(context).getAll();
        for (String key : all.keySet()) {
            try {
                cancelAlarm(context, Integer.parseInt(key));
            } catch (NumberFormatException ignored) {}
        }
        deleteAll(context);
    }

    static void restoreAll(Context context) {
        Map<String, ?> all = prefs(context).getAll();
        for (Map.Entry<String, ?> entry : all.entrySet()) {
            try {
                int id = Integer.parseInt(entry.getKey());
                JSONObject json = new JSONObject(String.valueOf(entry.getValue()));
                scheduleAlarm(
                    context,
                    id,
                    json.optString("title"),
                    json.optString("body"),
                    json.optInt("hour"),
                    json.optInt("minute")
                );
            } catch (Exception ignored) {}
        }
    }

    static void show(Context context, int id, String title, String body) {
        ensureChannel(context);
        Intent launch = new Intent(context, MainActivity.class);
        launch.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent content = PendingIntent.getActivity(context, id, launch, flags);
        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_notify)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setDefaults(NotificationCompat.DEFAULT_ALL)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setContentIntent(content);
        NotificationManagerCompat.from(context).notify(id, builder.build());
    }

    static long nextTriggerMillis(int hour, int minute) {
        Calendar calendar = Calendar.getInstance();
        calendar.set(Calendar.HOUR_OF_DAY, hour);
        calendar.set(Calendar.MINUTE, minute);
        calendar.set(Calendar.SECOND, 0);
        calendar.set(Calendar.MILLISECOND, 0);
        if (calendar.getTimeInMillis() <= System.currentTimeMillis()) {
            calendar.add(Calendar.DAY_OF_MONTH, 1);
        }
        return calendar.getTimeInMillis();
    }

    private static PendingIntent fireIntent(
        Context context,
        int id,
        String title,
        String body,
        int hour,
        int minute,
        int extraFlags
    ) {
        Intent intent = new Intent(context, ReminderPublisher.class);
        intent.setAction(ACTION_FIRE);
        intent.putExtra("id", id);
        intent.putExtra("title", title);
        intent.putExtra("body", body);
        intent.putExtra("hour", hour);
        intent.putExtra("minute", minute);
        int flags = extraFlags;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        return PendingIntent.getBroadcast(context, id, intent, flags);
    }
}
