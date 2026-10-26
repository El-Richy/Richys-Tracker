import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { lastGrapheme } from './grapheme.ts';

describe('lastGrapheme', () => {
  it('keeps a skin-tone emoji instead of the color modifier', () => {
    const chosen = '👍🏻';
    assert.equal(lastGrapheme(chosen), chosen);
    assert.notEqual(lastGrapheme(chosen), '\u{1F3FB}');
    assert.equal(lastGrapheme(`💪${chosen}`), chosen);
  });
});
