import test from 'node:test';
import assert from 'node:assert/strict';
import { lightTheme, darkTheme } from '../src/constants/theme.js';

test('light and dark themes have identical color token keys', () => {
  const lightKeys = Object.keys(lightTheme.colors).sort();
  const darkKeys = Object.keys(darkTheme.colors).sort();
  assert.deepEqual(lightKeys, darkKeys);
});
