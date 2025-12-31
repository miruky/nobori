/**
 * バナー設定とURLハッシュの相互変換。
 *
 * 現在の設定をURLの #t=...&th=... へ畳んで共有・ブックマークできるようにする。
 * 読み込み時は壊れた値や未知のテーマ・柄を無視して既定へ落とすので、
 * 手で書き換えたURLでも安全に復元できる。
 */

import { PATTERNS, THEMES, type PatternName, type ThemeName } from './banner';

export interface ShareState {
  title: string;
  subtitle: string;
  theme: ThemeName;
  pattern: PatternName;
  size: string;
  align: 'left' | 'center';
}

const SIZE_RE = /^\d{2,5}x\d{2,5}$/;

export function encodeState(state: ShareState): string {
  const params = new URLSearchParams();
  params.set('t', state.title);
  if (state.subtitle) params.set('s', state.subtitle);
  params.set('th', state.theme);
  params.set('p', state.pattern);
  params.set('sz', state.size);
  params.set('a', state.align);
  return params.toString();
}

export function decodeState(hash: string, fallback: ShareState): ShareState {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  // タイトルが無いハッシュは「共有された状態ではない」とみなし、丸ごと既定へ。
  const title = params.get('t');
  if (title === null) return { ...fallback };
  const theme = params.get('th');
  const pattern = params.get('p');
  const size = params.get('sz');
  const align = params.get('a');
  return {
    title,
    // 共有状態では、省略されたサブタイトルは「空」を意味する(既定で埋めない)。
    subtitle: params.get('s') ?? '',
    theme: theme !== null && theme in THEMES ? (theme as ThemeName) : fallback.theme,
    pattern:
      pattern !== null && (PATTERNS as readonly string[]).includes(pattern)
        ? (pattern as PatternName)
        : fallback.pattern,
    size: size !== null && SIZE_RE.test(size) ? size : fallback.size,
    align: align === 'left' || align === 'center' ? align : fallback.align,
  };
}
