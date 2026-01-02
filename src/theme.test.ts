import { describe, expect, it } from 'vitest';

import { effectiveTheme, nextPref, resolvePref } from './theme';

describe('resolvePref', () => {
  it('既知の値はそのまま返す', () => {
    expect(resolvePref('light')).toBe('light');
    expect(resolvePref('dark')).toBe('dark');
    expect(resolvePref('system')).toBe('system');
  });

  it('null・未知の値はsystemへ落とす', () => {
    expect(resolvePref(null)).toBe('system');
    expect(resolvePref('sepia')).toBe('system');
  });
});

describe('effectiveTheme', () => {
  it('systemはOSのダーク判定に従う', () => {
    expect(effectiveTheme('system', true)).toBe('dark');
    expect(effectiveTheme('system', false)).toBe('light');
  });

  it('明示指定はOSを無視する', () => {
    expect(effectiveTheme('light', true)).toBe('light');
    expect(effectiveTheme('dark', false)).toBe('dark');
  });
});

describe('nextPref', () => {
  it('system → light → dark → system と巡回する', () => {
    expect(nextPref('system')).toBe('light');
    expect(nextPref('light')).toBe('dark');
    expect(nextPref('dark')).toBe('system');
  });
});
