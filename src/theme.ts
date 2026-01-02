/**
 * UIテーマの解決と永続化。
 *
 * `data-theme` 属性で駆動し、CSS側はメディアクエリに依存しない。
 * 設定は system / light / dark の三択で、systemのときだけOS設定に追従する。
 * 純関数だけを置き、DOM操作とlocalStorageアクセスはmain側に閉じ込める。
 */

export type ThemePref = 'system' | 'light' | 'dark';
export type EffectiveTheme = 'light' | 'dark';

export const THEME_KEY = 'nobori:theme';
export const PREF_ORDER: ThemePref[] = ['system', 'light', 'dark'];

export const PREF_LABEL: Record<ThemePref, string> = {
  system: 'システム',
  light: 'ライト',
  dark: 'ダーク',
};

/** localStorageの生値を安全に正規化する。未知の値はsystemへ。 */
export function resolvePref(raw: string | null): ThemePref {
  return raw === 'light' || raw === 'dark' || raw === 'system' ? raw : 'system';
}

/** 設定とOSのダーク判定から、実際に適用する明暗を決める。 */
export function effectiveTheme(pref: ThemePref, systemDark: boolean): EffectiveTheme {
  if (pref === 'system') return systemDark ? 'dark' : 'light';
  return pref;
}

/** トグルで巡回する次の設定値を返す(system → light → dark → system)。 */
export function nextPref(pref: ThemePref): ThemePref {
  const index = PREF_ORDER.indexOf(pref);
  return PREF_ORDER[(index + 1) % PREF_ORDER.length] ?? 'system';
}
