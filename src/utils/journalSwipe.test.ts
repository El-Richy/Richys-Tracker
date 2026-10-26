import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { swipeDestination } from './journalSwipe.ts';

describe('swipeDestination', () => {
  it('goes from Diario to Notas before Hábitos, and back the same way', () => {
    assert.deepEqual(swipeDestination('tasks', 'journal', 1), { tab: 'journal', journalPane: 'journal' });
    assert.deepEqual(swipeDestination('journal', 'journal', 1), { tab: 'journal', journalPane: 'note' });
    assert.deepEqual(swipeDestination('journal', 'note', 1), { tab: 'habits', journalPane: 'note' });
    assert.deepEqual(swipeDestination('habits', 'note', -1), { tab: 'journal', journalPane: 'note' });
    assert.deepEqual(swipeDestination('journal', 'note', -1), { tab: 'journal', journalPane: 'journal' });
    assert.deepEqual(swipeDestination('journal', 'journal', -1), { tab: 'tasks', journalPane: 'journal' });
  });
});
