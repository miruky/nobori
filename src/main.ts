/** noboriのUI。入力のたびにrenderBannerを呼び、プレビューを差し替える。 */

import './style.css';
import {
  THEMES,
  renderBanner,
  type BannerOptions,
  type PatternName,
  type ThemeName,
} from './banner';
import { decodeState, encodeState, type ShareState } from './share';

function query<T extends Element>(selector: string): T {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error(`要素が見つからない: ${selector}`);
  return el;
}

const titleInput = query<HTMLInputElement>('#title');
const subtitleInput = query<HTMLInputElement>('#subtitle');
const themeSelect = query<HTMLSelectElement>('#theme');
const patternSelect = query<HTMLSelectElement>('#pattern');
const sizeSelect = query<HTMLSelectElement>('#size');
const alignSelect = query<HTMLSelectElement>('#align');
const preview = query<HTMLDivElement>('#preview');
const copied = query<HTMLSpanElement>('#copied');

for (const [name, theme] of Object.entries(THEMES)) {
  const option = document.createElement('option');
  option.value = name;
  option.textContent = theme.label;
  themeSelect.append(option);
}

// HTMLの初期値を共有状態の既定とし、URLハッシュがあればそれで上書きする。
const defaults: ShareState = readState();
applyState(decodeState(location.hash, defaults));

function readState(): ShareState {
  return {
    title: titleInput.value,
    subtitle: subtitleInput.value,
    theme: themeSelect.value as ThemeName,
    pattern: patternSelect.value as PatternName,
    size: sizeSelect.value,
    align: alignSelect.value as 'left' | 'center',
  };
}

function applyState(state: ShareState): void {
  titleInput.value = state.title;
  subtitleInput.value = state.subtitle;
  themeSelect.value = state.theme;
  patternSelect.value = state.pattern;
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
  };
}

let currentSvg = '';

function render(): void {
  try {
    currentSvg = renderBanner(currentOptions());
    preview.innerHTML = currentSvg;
    // 現在の設定をURLハッシュへ畳む(履歴は汚さない)。コピーすればそのまま共有できる。
    history.replaceState(null, '', `#${encodeState(readState())}`);
  } catch {
    // タイトル未入力の瞬間は直前のプレビューを残す
  }
}

for (const control of [
  titleInput,
  subtitleInput,
  themeSelect,
  patternSelect,
  sizeSelect,
  alignSelect,
]) {
  control.addEventListener('input', render);
}

query<HTMLButtonElement>('#download').addEventListener('click', () => {
  const blob = new Blob([currentSvg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'banner.svg';
  anchor.click();
  URL.revokeObjectURL(url);
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
