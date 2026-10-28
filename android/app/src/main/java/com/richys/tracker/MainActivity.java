package com.richys.tracker;

import android.Manifest;
import android.os.Bundle;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private final ActivityResultLauncher<String> notificationPermissionLauncher =
        registerForActivityResult(
            new ActivityResultContracts.RequestPermission(),
            ReminderPlugin::onNotificationPermissionResult
        );

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(GallerySavePlugin.class);
        registerPlugin(ReminderPlugin.class);
        super.onCreate(savedInstanceState);
    }

    void requestNotificationPermission() {
        notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS);
    }
}
