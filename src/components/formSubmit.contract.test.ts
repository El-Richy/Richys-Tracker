import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

describe('reminder save does not wait on permission', () => {
  for (const file of ['src/components/HabitForm.tsx', 'src/components/TaskForm.tsx']) {
    it(file, () => {
      const src = readFileSync(file, 'utf8');
      assert.match(src, /type="button"\s+onClick=\{handleSubmit\}/);
      assert.doesNotMatch(src, /type="submit"/);
      assert.doesNotMatch(src, /requestNotificationPermission\(/);
      assert.match(src, /onSubmit\(\{/);
    });
  }

  it('user saves ask the native scheduler to report a failed permission', () => {
    const habits = readFileSync('src/hooks/habits/useHabitActions.ts', 'utf8');
    const tasks = readFileSync('src/hooks/useTasks.ts', 'utf8');
    assert.match(habits, /scheduleHabitReminder\([^)]+, true\)/);
    assert.match(tasks, /scheduleTaskReminder\([^)]+, true\)/);
  });
});
