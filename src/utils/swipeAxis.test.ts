import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { classifySwipe, tabIndexFromClientX } from './swipeAxis.ts';

describe('classifySwipe', () => {
  it('keeps a mostly horizontal move even when it is not perfectly flat', () => {
    assert.equal(classifySwipe(9, 9), 'pending');
    assert.equal(classifySwipe(10, 9), 'horizontal');
    assert.equal(classifySwipe(40, 12), 'horizontal');
    assert.equal(classifySwipe(9, 11), 'vertical');
  });
});

describe('tabIndexFromClientX', () => {
  it('maps a finger moving across the bar to successive tabs', () => {
    const rect = { left: 0, width: 250 };
    assert.equal(tabIndexFromClientX(10, rect, 5), 0);
    assert.equal(tabIndexFromClientX(60, rect, 5), 1);
    assert.equal(tabIndexFromClientX(249, rect, 5), 4);
  });
});
