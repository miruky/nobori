/**
 * SVGバナーの生成。
 *
 * 入力からSVG文字列を組み立てる純関数で、UIにもテストにも依存しない。
 * 出力はGitHubのREADMEにそのまま貼れる自己完結のSVG
 * (外部フォント・外部画像なし)になるよう、書体はシステムフォント
 * スタックで指定する。
 */

export const THEMES = {
  indigo: {
    label: '藍',
    from: '#1e2a78',
    to: '#3f51b5',
    text: '#f5f6fb',
    sub: '#c3c9ec',
    line: '#8e9ad6',
  },
  forest: {
    label: '深緑',
    from: '#1b4332',
    to: '#2d6a4f',
    text: '#f0f7f2',
    sub: '#bcd8c5',
    line: '#74a98c',
  },
  sunset: {
    label: '夕暮れ',
    from: '#7d2a42',
    to: '#c46d3b',
    text: '#fdf3ec',
    sub: '#f3d3bc',
    line: '#e0a070',
  },
  mono: {
    label: '墨',
    from: '#16181c',
    to: '#33363d',
    text: '#eceef1',
    sub: '#aab0b9',
    line: '#5b626d',
  },
  sakura: {
    label: '桜',
    from: '#f6e7ea',
    to: '#f3d4dc',
    text: '#5a2a35',
    sub: '#8d5f6b',
    line: '#d9a6b3',
  },
  ocean: {
    label: '海',
    from: '#0a4d68',
    to: '#1b7a9e',
    text: '#eef7fb',
    sub: '#bfe0ec',
    line: '#6fb3cc',
  },
  amber: {
    label: '琥珀',
    from: '#7a4a10',
    to: '#c8882a',
    text: '#fdf6ea',
    sub: '#f0d8b0',
    line: '#e0b270',
  },
  plum: {
    label: '葡萄',
    from: '#3d1f5c',
    to: '#6b3fa0',
    text: '#f4eefb',
    sub: '#d6c4ea',
    line: '#a585c9',
  },
} as const;

export type ThemeName = keyof typeof THEMES;

export const PATTERNS = [
  'none',
  'dots',
  'grid',
  'diagonal',
  'waves',
  'seigaiha',
  'cross',
  'chevron',
] as const;
export type PatternName = (typeof PATTERNS)[number];

/** 柄の表示名。UIのセレクトはこれを使って組み立てる。 */
export const PATTERN_LABELS: Record<PatternName, string> = {
  none: 'なし',
  dots: '水玉',
  grid: '方眼',
  diagonal: '斜線',
  waves: '波',
  seigaiha: '青海波',
  cross: '十字',
  chevron: '山形',
};

export interface BannerOptions {
  title: string;
  subtitle?: string;
  width?: number;
  height?: number;
  theme?: ThemeName;
  pattern?: PatternName;
  align?: 'left' | 'center';
  radius?: number;
}

export function escapeXml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function patternDef(name: PatternName, line: string): string {
  switch (name) {
    case 'none':
      return '';
    case 'dots':
      return `<pattern id="pat" width="24" height="24" patternUnits="userSpaceOnUse">
  <circle cx="4" cy="4" r="1.6" fill="${line}" opacity="0.35"/>
</pattern>`;
    case 'grid':
      return `<pattern id="pat" width="28" height="28" patternUnits="userSpaceOnUse">
  <path d="M28 0H0V28" fill="none" stroke="${line}" stroke-width="1" opacity="0.25"/>
</pattern>`;
    case 'diagonal':
      return `<pattern id="pat" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
  <line x1="0" y1="0" x2="0" y2="16" stroke="${line}" stroke-width="1.5" opacity="0.3"/>
</pattern>`;
    case 'waves':
      return `<pattern id="pat" width="56" height="20" patternUnits="userSpaceOnUse">
  <path d="M0 10 Q 14 0, 28 10 T 56 10" fill="none" stroke="${line}" stroke-width="1.4" opacity="0.32"/>
</pattern>`;
    case 'seigaiha':
      return `<pattern id="pat" width="40" height="20" patternUnits="userSpaceOnUse">
  <g fill="none" stroke="${line}" stroke-width="1.2" opacity="0.3">
    <circle cx="20" cy="20" r="18"/>
    <circle cx="20" cy="20" r="12"/>
    <circle cx="20" cy="20" r="6"/>
    <circle cx="0" cy="10" r="18"/>
    <circle cx="40" cy="10" r="18"/>
  </g>
</pattern>`;
    case 'cross':
      return `<pattern id="pat" width="26" height="26" patternUnits="userSpaceOnUse">
  <path d="M13 8v10M8 13h10" stroke="${line}" stroke-width="1.3" opacity="0.3"/>
</pattern>`;
    case 'chevron':
      return `<pattern id="pat" width="28" height="14" patternUnits="userSpaceOnUse">
  <path d="M0 12 L14 3 L28 12" fill="none" stroke="${line}" stroke-width="1.4" opacity="0.3"/>
</pattern>`;
  }
}

/** バナーのSVG文字列を生成する。タイトルが空のときはErrorを投げる。 */
export function renderBanner(options: BannerOptions): string {
  const title = options.title.trim();
  if (title === '') throw new Error('タイトルが空');
  const subtitle = options.subtitle?.trim() ?? '';
  const width = Math.max(160, options.width ?? 800);
  const height = Math.max(80, options.height ?? 200);
  const theme = THEMES[options.theme ?? 'indigo'];
  const pattern = options.pattern ?? 'none';
  const align = options.align ?? 'center';
  const radius = Math.max(0, options.radius ?? 12);

  const anchor = align === 'center' ? 'middle' : 'start';
  const x = align === 'center' ? width / 2 : Math.round(height * 0.32);
  const titleSize = Math.round(Math.min(height * 0.26, width / Math.max(6, title.length)));
  const subSize = Math.max(11, Math.round(titleSize * 0.42));
  const titleY = subtitle ? height * 0.46 : height * 0.55;
  const subY = height * 0.68;

  const fontStack =
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Hiragino Sans', 'Noto Sans JP', sans-serif";
  const def = patternDef(pattern, theme.line);
  const patternRect =
    pattern === 'none'
      ? ''
      : `\n  <rect width="${width}" height="${height}" rx="${radius}" fill="url(#pat)"/>`;
  const subtitleText = subtitle
    ? `\n  <text x="${x}" y="${subY}" text-anchor="${anchor}" font-family="${fontStack}" font-size="${subSize}" fill="${theme.sub}">${escapeXml(subtitle)}</text>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${escapeXml(title)}">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${theme.from}"/>
    <stop offset="1" stop-color="${theme.to}"/>
  </linearGradient>
${def}
</defs>
  <rect width="${width}" height="${height}" rx="${radius}" fill="url(#bg)"/>${patternRect}
  <text x="${x}" y="${titleY}" text-anchor="${anchor}" dominant-baseline="middle" font-family="${fontStack}" font-size="${titleSize}" font-weight="700" letter-spacing="0.02em" fill="${theme.text}">${escapeXml(title)}</text>${subtitleText}
</svg>
`;
}
