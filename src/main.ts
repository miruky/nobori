/** noboriのUI。入力のたびにrenderBannerを呼び、プレビューを差し替える。 */

import './style.css';
import {
  BACKGROUNDS,
  FONTS,
  PATTERNS,
  PATTERN_LABELS,
  THEMES,
  renderBanner,
  type BackgroundName,
  type BannerOptions,
  type FontName,
  type PatternName,
  type ThemeName,
} from './banner';
import { decodeState, encodeState, type ShareState } from './share';
import {
  PREF_LABEL,
  THEME_KEY,
  effectiveTheme,
  nextPref,
  resolvePref,
  type ThemePref,
} from './theme';

function query<T extends Element>(selector: string): T {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error(`要素が見つからない: ${selector}`);
  return el;
}

const titleInput = query<HTMLInputElement>('#title');
const subtitleInput = query<HTMLInputElement>('#subtitle');
const themeSelect = query<HTMLSelectElement>('#theme');
const patternSelect = query<HTMLSelectElement>('#pattern');
const fontSelect = query<HTMLSelectElement>('#font');
const backgroundSelect = query<HTMLSelectElement>('#background');
const sizeSelect = query<HTMLSelectElement>('#size');
const alignSelect = query<HTMLSelectElement>('#align');
const preview = query<HTMLDivElement>('#preview');
const copied = query<HTMLSpanElement>('#copied');

function fillSelect(select: HTMLSelectElement, entries: [string, string][]): void {
  for (const [value, label] of entries) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    select.append(option);
  }
}

fillSelect(
  themeSelect,
  Object.entries(THEMES).map(([name, theme]) => [name, theme.label]),
);
fillSelect(
  patternSelect,
  PATTERNS.map((name) => [name, PATTERN_LABELS[name]]),
);
fillSelect(
  fontSelect,
  Object.entries(FONTS).map(([name, font]) => [name, font.label]),
);
fillSelect(backgroundSelect, Object.entries(BACKGROUNDS));
patternSelect.value = 'waves'; // 既定の柄

// ── 状態の永続化(前回の設定を次回に引き継ぐ)──

const STATE_KEY = 'nobori:state';

function readStore(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStore(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // プライベートモード等で保存できなくても致命的ではない
  }
}

// 優先順位: URLハッシュ(共有) > localStorage(前回) > HTMLの既定。
const htmlDefaults: ShareState = readState();
const stored = readStore(STATE_KEY);
const base = stored ? decodeState(`#${stored}`, htmlDefaults) : htmlDefaults;
applyState(decodeState(location.hash, base));

function readState(): ShareState {
  return {
    title: titleInput.value,
    subtitle: subtitleInput.value,
    theme: themeSelect.value as ThemeName,
    pattern: patternSelect.value as PatternName,
    size: sizeSelect.value,
    align: alignSelect.value as 'left' | 'center',
    font: fontSelect.value as FontName,
    background: backgroundSelect.value as BackgroundName,
  };
}

function applyState(state: ShareState): void {
  titleInput.value = state.title;
  subtitleInput.value = state.subtitle;
  themeSelect.value = state.theme;
  patternSelect.value = state.pattern;
  fontSelect.value = state.font;
  backgroundSelect.value = state.background;
  if ([...sizeSelect.options].some((option) => option.value === state.size)) {
    sizeSelect.value = state.size;
  }
  alignSelect.value = state.align;
}

function currentOptions(): BannerOptions {
  const [width, height] = sizeSelect.value.split('x').map(Number);
  return {
    title: titleInput.value || 'nobori',
    subtitle: subtitleInput.value,
    width,
    height,
    theme: themeSelect.value as ThemeName,
    pattern: patternSelect.value as PatternName,
    align: alignSelect.value as 'left' | 'center',
    font: fontSelect.value as FontName,
    background: backgroundSelect.value as BackgroundName,
  };
}

let currentSvg = '';

function render(): void {
  try {
    currentSvg = renderBanner(currentOptions());
    preview.innerHTML = currentSvg;
    const encoded = encodeState(readState());
    // 現在の設定をURLハッシュへ畳む(履歴は汚さない)。コピーすればそのまま共有できる。
    history.replaceState(null, '', `#${encoded}`);
    // 次回アクセスのために最後の設定を控える。
    writeStore(STATE_KEY, encoded);
  } catch {
    // タイトル未入力の瞬間は直前のプレビューを残す
  }
}

for (const control of [
  titleInput,
  subtitleInput,
  themeSelect,
  patternSelect,
  fontSelect,
  backgroundSelect,
  sizeSelect,
  alignSelect,
]) {
  control.addEventListener('input', render);
}

// 選択を切り替えたときだけプレビューを軽く沈めて戻す(タイピング中は出さない)。
function popPreview(): void {
  preview.classList.remove('pop');
  void preview.offsetWidth;
  preview.classList.add('pop');
}

for (const select of [
  themeSelect,
  patternSelect,
  fontSelect,
  backgroundSelect,
  sizeSelect,
  alignSelect,
]) {
  select.addEventListener('change', popPreview);
}

// ── UIテーマの切替(system → light → dark)──

const themeToggle = query<HTMLButtonElement>('#theme-toggle');
const themeLabel = query<HTMLSpanElement>('#theme-label');
const darkQuery = matchMedia('(prefers-color-scheme: dark)');
let themePref: ThemePref = resolvePref(readStore(THEME_KEY));

function applyTheme(): void {
  const effective = effectiveTheme(themePref, darkQuery.matches);
  document.documentElement.dataset.theme = effective;
  themeToggle.dataset.effective = effective;
  themeLabel.textContent = PREF_LABEL[themePref];
  themeToggle.setAttribute('aria-label', `テーマ切替(現在: ${PREF_LABEL[themePref]})`);
}

themeToggle.addEventListener('click', () => {
  themePref = nextPref(themePref);
  writeStore(THEME_KEY, themePref);
  applyTheme();
});

darkQuery.addEventListener('change', () => {
  if (themePref === 'system') applyTheme();
});

applyTheme();

query<HTMLButtonElement>('#download').addEventListener('click', () => {
  const blob = new Blob([currentSvg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'banner.svg';
  anchor.click();
  URL.revokeObjectURL(url);
});

// SVGをcanvasへ2倍解像度で焼いてPNGとして書き出す。READMEに直接置きたい人向け。
query<HTMLButtonElement>('#download-png').addEventListener('click', () => {
  const [width, height] = sizeSelect.value.split('x').map(Number);
  const scale = 2;
  const svgUrl = URL.createObjectURL(
    new Blob([currentSvg], { type: 'image/svg+xml;charset=utf-8' }),
  );
  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = (width ?? 800) * scale;
    canvas.height = (height ?? 200) * scale;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(image, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(svgUrl);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const pngUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = pngUrl;
      anchor.download = 'banner.png';
      anchor.click();
      URL.revokeObjectURL(pngUrl);
    }, 'image/png');
  };
  image.src = svgUrl;
});

query<HTMLButtonElement>('#copy').addEventListener('click', () => {
  void navigator.clipboard.writeText(currentSvg).then(() => {
    copied.textContent = 'コピーした';
    setTimeout(() => (copied.textContent = ''), 1600);
  });
});

query<HTMLButtonElement>('#copy-link').addEventListener('click', () => {
  void navigator.clipboard.writeText(location.href).then(() => {
    copied.textContent = '共有リンクをコピーした';
    setTimeout(() => (copied.textContent = ''), 1600);
  });
});

render();
