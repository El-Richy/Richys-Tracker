import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

describe('native reminders use the Reminder plugin', () => {
  const src = readFileSync('src/lib/notifications.ts', 'utf8');

  it('schedules through Reminder.requestAndSchedule, not LocalNotifications', () => {
    assert.match(src, /registerPlugin<ReminderPlugin>\('Reminder'\)/);
    assert.match(src, /Reminder\.requestAndSchedule/);
    assert.doesNotMatch(src, /LocalNotifications/);
    assert.doesNotMatch(src, /isExactNotification/);
  });

  it('user saves ask the native scheduler to confirm', () => {
    assert.match(src, /confirm: reportFailure/);
  });
});
