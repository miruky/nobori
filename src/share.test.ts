import { describe, expect, it } from 'vitest';

import { decodeState, encodeState, type ShareState } from './share';

const base: ShareState = {
  title: 'nobori',
  subtitle: 'README banner generator',
  theme: 'indigo',
  pattern: 'waves',
  size: '800x200',
  align: 'center',
};

describe('encodeState / decodeState', () => {
  it('往復しても同じ設定に戻る', () => {
    const state: ShareState = {
      title: '見出し & テスト',
      subtitle: '',
      theme: 'forest',
      pattern: 'dots',
      size: '1280x320',
      align: 'left',
    };
    expect(decodeState(`#${encodeState(state)}`, base)).toEqual(state);
  });

  it('サブタイトルが空ならクエリに含めない', () => {
    const encoded = encodeState({ ...base, subtitle: '' });
    expect(encoded).not.toContain('s=');
  });

  it('未知のテーマ・柄・配置は既定へ落とす', () => {
    const decoded = decodeState('#t=A&th=neon&p=plaid&a=top&sz=zzz', base);
    expect(decoded.theme).toBe(base.theme);
    expect(decoded.pattern).toBe(base.pattern);
    expect(decoded.align).toBe(base.align);
    expect(decoded.size).toBe(base.size);
    expect(decoded.title).toBe('A');
  });

  it('空のハッシュは丸ごと既定になる', () => {
    expect(decodeState('', base)).toEqual(base);
    expect(decodeState('#', base)).toEqual(base);
  });

  it('記号を含むタイトルもエスケープして往復できる', () => {
    const state: ShareState = { ...base, title: 'a=b&c d', subtitle: '<x>' };
    expect(decodeState(`#${encodeState(state)}`, base)).toEqual(state);
  });
});
