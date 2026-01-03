import { describe, expect, it } from 'vitest';

import { BACKGROUNDS, FONTS, PATTERNS, THEMES } from './banner';
import { markdownSnippet, randomDesign } from './presets';

describe('randomDesign', () => {
  it('rng=0 は各候補の先頭を選ぶ(柄なしは除外)', () => {
    const design = randomDesign(() => 0);
    expect(design.theme).toBe(Object.keys(THEMES)[0]);
    expect(design.pattern).toBe(PATTERNS.filter((name) => name !== 'none')[0]);
    expect(design.font).toBe(Object.keys(FONTS)[0]);
    expect(design.background).toBe(Object.keys(BACKGROUNDS)[0]);
  });

  it('rngが上限近くでも添字が範囲内に収まる', () => {
    const design = randomDesign(() => 0.9999);
    expect(design.theme in THEMES).toBe(true);
    expect(PATTERNS).toContain(design.pattern);
    expect(design.font in FONTS).toBe(true);
    expect(design.background in BACKGROUNDS).toBe(true);
  });

  it('柄は必ずnone以外になる', () => {
    for (let r = 0; r < 1; r += 0.1) {
      expect(randomDesign(() => r).pattern).not.toBe('none');
    }
  });
});

describe('markdownSnippet', () => {
  it('タイトルをaltにした画像記法を作る', () => {
    expect(markdownSnippet('nobori')).toBe('![nobori](banner.svg)');
  });

  it('ファイル名を差し替えられる', () => {
    expect(markdownSnippet('nobori', 'docs/banner.svg')).toBe('![nobori](docs/banner.svg)');
  });

  it('角括弧と改行を畳んで記法を壊さない', () => {
    expect(markdownSnippet('a[b]\nc')).toBe('![a b c](banner.svg)');
  });

  it('空白だけのタイトルはbannerへフォールバック', () => {
    expect(markdownSnippet('   ')).toBe('![banner](banner.svg)');
  });
});
