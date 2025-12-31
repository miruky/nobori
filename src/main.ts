/** noboriのUI。入力のたびにrenderBannerを呼び、プレビューを差し替える。 */

import './style.css';
import {
  THEMES,
  renderBanner,
  type BannerOptions,
  type PatternName,
  type ThemeName,
} from './banner';

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

render();
