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
import { markdownSnippet, randomDesign } from './presets';
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

// 「おまかせ」はタイトル等を保ったまま見た目の4項目だけを振り直す。
function shuffle(): void {
  const design = randomDesign();
  themeSelect.value = design.theme;
  patternSelect.value = design.pattern;
  fontSelect.value = design.font;
  backgroundSelect.value = design.background;
  render();
  popPreview();
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

function cycleTheme(): void {
  themePref = nextPref(themePref);
  writeStore(THEME_KEY, themePref);
  applyTheme();
}

themeToggle.addEventListener('click', cycleTheme);
darkQuery.addEventListener('change', () => {
  if (themePref === 'system') applyTheme();
});
applyTheme();

// ── 書き出しとコピー ──

let flashTimer = 0;
function flash(message: string): void {
  copied.textContent = message;
  clearTimeout(flashTimer);
  flashTimer = window.setTimeout(() => (copied.textContent = ''), 1600);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function downloadSvg(): void {
  downloadBlob(new Blob([currentSvg], { type: 'image/svg+xml' }), 'banner.svg');
}

// SVGをcanvasへ2倍解像度で焼いてPNGとして書き出す。READMEに直接置きたい人向け。
function downloadPng(): void {
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
      if (blob) downloadBlob(blob, 'banner.png');
    }, 'image/png');
  };
  image.src = svgUrl;
}

function copyText(text: string, message: string): void {
  void navigator.clipboard.writeText(text).then(() => flash(message));
}

query<HTMLButtonElement>('#download').addEventListener('click', downloadSvg);
query<HTMLButtonElement>('#download-png').addEventListener('click', downloadPng);
query<HTMLButtonElement>('#copy').addEventListener('click', () =>
  copyText(currentSvg, 'コピーした'),
);
query<HTMLButtonElement>('#copy-md').addEventListener('click', () =>
  copyText(markdownSnippet(titleInput.value || 'nobori'), 'Markdownをコピーした'),
);
query<HTMLButtonElement>('#copy-link').addEventListener('click', () =>
  copyText(location.href, '共有リンクをコピーした'),
);
query<HTMLButtonElement>('#shuffle').addEventListener('click', shuffle);

// ── キーボードショートカット(入力中と修飾キー併用は無視)──

document.addEventListener('keydown', (event) => {
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  const target = event.target as HTMLElement | null;
  if (
    target &&
    (target.tagName === 'INPUT' ||
      target.tagName === 'SELECT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable)
  ) {
    return;
  }
  switch (event.key.toLowerCase()) {
    case 'd':
      downloadSvg();
      break;
    case 'c':
      copyText(currentSvg, 'コピーした');
      break;
    case 'r':
      shuffle();
      break;
    case 't':
      cycleTheme();
      break;
    default:
      return;
  }
  event.preventDefault();
});

render();
