import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

describe('native reminder alarm path', () => {
  const plugin = readFileSync('android/app/src/main/java/com/richys/tracker/ReminderPlugin.java', 'utf8');
  const store = readFileSync('android/app/src/main/java/com/richys/tracker/ReminderStore.java', 'utf8');
  const publisher = readFileSync('android/app/src/main/java/com/richys/tracker/ReminderPublisher.java', 'utf8');
  const main = readFileSync('android/app/src/main/java/com/richys/tracker/MainActivity.java', 'utf8');
  const manifest = readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8');
  const js = readFileSync('src/lib/notifications.ts', 'utf8');

  it('does not schedule Capacitor LocalNotifications', () => {
    assert.doesNotMatch(js, /LocalNotifications|isExactNotification/);
    assert.doesNotMatch(plugin + store + main, /LocalNotifications|isExactNotification|ActivityCompat/);
  });

  it('requests permission with Activity Result', () => {
    assert.match(main, /ActivityResultContracts\.RequestPermission/);
    assert.doesNotMatch(main, /requestPermissions\s*\(/);
  });

  it('uses exact alarms and string extras', () => {
    assert.match(store, /setExactAndAllowWhileIdle\(AlarmManager\.RTC_WAKEUP/);
    assert.match(store, /putExtra\("title"/);
    assert.match(store, /putExtra\("body"/);
    assert.doesNotMatch(store + publisher, /putExtra\([^)]*Notification/);
    assert.match(publisher, /getStringExtra\("title"\)/);
    assert.match(publisher, /ReminderStore\.show\(/);
  });

  it('declares USE_EXACT_ALARM and does not clear the tray', () => {
    assert.match(manifest, /android\.permission\.USE_EXACT_ALARM/);
    assert.match(js, /return \(\) => \{\}/);
    assert.doesNotMatch(js, /removeAllDeliveredNotifications/);
  });

  it('queues cancel on the same native scheduler as schedule', () => {
    assert.match(js, /async function nativeCancel[\s\S]*enqueueNativeSchedule/);
  });
});
