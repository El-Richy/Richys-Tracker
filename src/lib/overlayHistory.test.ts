import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { overlayPopAction } from './overlayHistory.ts';

describe('overlayPopAction', () => {
  it('stays on the page when a sheet close already dropped the overlay count', () => {
    assert.equal(overlayPopAction(0, true), 'stay');
  });

  it('stays while the sheet still owns the history entry', () => {
    assert.equal(overlayPopAction(1, false), 'stay');
  });

  it('navigates only when no sheet owns the pop', () => {
    assert.equal(overlayPopAction(0, false), 'navigate');
  });
});
