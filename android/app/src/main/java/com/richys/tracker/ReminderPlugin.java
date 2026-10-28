package com.richys.tracker;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.Locale;

@CapacitorPlugin(name = "Reminder")
public class ReminderPlugin extends Plugin {
    private static ReminderPlugin instance;
    private static PluginCall pending;

    @Override
    public void load() {
        super.load();
        instance = this;
    }

    @PluginMethod
    public void requestAndSchedule(PluginCall call) {
        Integer id = call.getInt("id");
        Integer hour = call.getInt("hour");
        Integer minute = call.getInt("minute");
        if (id == null || hour == null || minute == null) {
            call.reject("id, hour and minute are required");
            return;
        }
        if (needsNotificationPermission()) {
            pending = call;
            ((MainActivity) getActivity()).requestNotificationPermission();
            return;
        }
        finishSchedule(call);
    }

    @PluginMethod
    public void cancel(PluginCall call) {
        Integer id = call.getInt("id");
        if (id != null) {
            ReminderStore.cancelAlarm(getContext(), id);
        }
        call.resolve();
    }

    @PluginMethod
    public void cancelAll(PluginCall call) {
        ReminderStore.cancelAll(getContext());
        call.resolve();
    }

    static void onNotificationPermissionResult(boolean granted) {
        PluginCall call = pending;
        pending = null;
        if (call == null) return;
        if (!granted) {
            JSObject result = new JSObject();
            result.put("ok", false);
            result.put("reason", "notifications");
            call.resolve(result);
            return;
        }
        finishSchedule(call);
    }

    private boolean needsNotificationPermission() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return false;
        return ContextCompat.checkSelfPermission(getContext(), Manifest.permission.POST_NOTIFICATIONS)
            != PackageManager.PERMISSION_GRANTED;
    }

    private static void finishSchedule(PluginCall call) {
        ReminderPlugin plugin = instance;
        if (plugin == null) {
            call.reject("reminder plugin unavailable");
            return;
        }
        Integer id = call.getInt("id");
        Integer hour = call.getInt("hour");
        Integer minute = call.getInt("minute");
        if (id == null || hour == null || minute == null) {
            call.reject("id, hour and minute are required");
            return;
        }
        String title = call.getString("title", "Richy's Tracker");
        String body = call.getString("body", "");
        boolean confirm = Boolean.TRUE.equals(call.getBoolean("confirm", false));
        Context context = plugin.getContext();
        ReminderStore.ensureChannel(context);
        ReminderStore.save(context, id, title, body, hour, minute);
        ReminderStore.scheduleAlarm(context, id, title, body, hour, minute);
        boolean exact = ReminderStore.canExact(context);
        if (!exact && confirm) {
            ReminderStore.requestExactSettings(context);
        }
        if (confirm) {
            String time = String.format(Locale.getDefault(), "%02d:%02d", hour, minute);
            ReminderStore.show(
                context,
                ReminderStore.CONFIRM_ID,
                "Richy's Tracker",
                "Recordatorio activado para las " + time
            );
        }
        JSObject result = new JSObject();
        result.put("ok", true);
        result.put("exact", exact);
        call.resolve(result);
    }
}
