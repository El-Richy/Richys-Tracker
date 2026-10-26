import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { hexToRgbChannels } from './accent.ts';

describe('hexToRgbChannels', () => {
  it('turns the chosen accent into channels the theme can paint', () => {
    assert.equal(hexToRgbChannels('#3B82F6'), '59 130 246');
    assert.equal(hexToRgbChannels('#F0611A'), '240 97 26');
    assert.equal(hexToRgbChannels('nope'), '240 97 26');
  });
});
