package com.richys.tracker;

import android.content.ContentValues;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.OutputStream;

@CapacitorPlugin(name = "GallerySave")
public class GallerySavePlugin extends Plugin {

    @PluginMethod
    public void saveJpeg(PluginCall call) {
        String data = call.getString("data");
        String filename = call.getString("filename");
        if (data == null || filename == null || filename.isEmpty()) {
            call.reject("data and filename required");
            return;
        }

        int comma = data.indexOf(',');
        if (comma >= 0) {
            data = data.substring(comma + 1);
        }

        byte[] bytes;
        try {
            bytes = Base64.decode(data, Base64.DEFAULT);
        } catch (IllegalArgumentException e) {
            call.reject("invalid base64");
            return;
        }

        ContentValues values = new ContentValues();
        values.put(MediaStore.Images.Media.DISPLAY_NAME, filename);
        values.put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg");
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            values.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/RichysTracker");
            values.put(MediaStore.Images.Media.IS_PENDING, 1);
        }

        Uri uri = getContext().getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values);
        if (uri == null) {
            call.reject("insert failed");
            return;
        }

        try (OutputStream os = getContext().getContentResolver().openOutputStream(uri)) {
            if (os == null) {
                call.reject("stream failed");
                return;
            }
            os.write(bytes);
        } catch (Exception e) {
            call.reject(e.getMessage() != null ? e.getMessage() : "write failed");
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            ContentValues done = new ContentValues();
            done.put(MediaStore.Images.Media.IS_PENDING, 0);
            getContext().getContentResolver().update(uri, done, null, null);
        }

        call.resolve();
    }
}
