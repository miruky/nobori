/**
 * おまかせ生成とMarkdown貼り付けスニペット。どちらもDOMに依存しない純関数。
 *
 * randomDesignは乱数源を差し込めるようにして、テストで結果を固定できるようにする。
 */

import {
  BACKGROUNDS,
  FONTS,
  PATTERNS,
  THEMES,
  type BackgroundName,
  type FontName,
  type PatternName,
  type ThemeName,
} from './banner';

export interface Design {
  theme: ThemeName;
  pattern: PatternName;
  font: FontName;
  background: BackgroundName;
}

function pick<T>(items: readonly T[], rng: () => number): T {
  const index = Math.min(items.length - 1, Math.floor(rng() * items.length));
  return items[index] ?? items[0]!;
}

/** テーマ・柄・書体・背景をランダムに選ぶ。柄なしは外し、必ず模様が乗る。 */
export function randomDesign(rng: () => number = Math.random): Design {
  const patterns = PATTERNS.filter((name) => name !== 'none');
  return {
    theme: pick(Object.keys(THEMES) as ThemeName[], rng),
    pattern: pick(patterns, rng),
    font: pick(Object.keys(FONTS) as FontName[], rng),
    background: pick(Object.keys(BACKGROUNDS) as BackgroundName[], rng),
  };
}

/** READMEへ貼るMarkdownの画像記法。altはタイトルから作り、記法を壊す文字を畳む。 */
export function markdownSnippet(title: string, file = 'banner.svg'): string {
  const alt = title.replace(/[[\]\r\n]+/g, ' ').trim() || 'banner';
  return `![${alt}](${file})`;
}
