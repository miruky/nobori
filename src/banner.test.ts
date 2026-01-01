import { describe, expect, it } from 'vitest';

import { PATTERNS, PATTERN_LABELS, THEMES, escapeXml, renderBanner } from './banner';

describe('escapeXml', () => {
  it('5種の特殊文字を実体参照へ', () => {
    expect(escapeXml(`<a href="x">&'</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;&amp;&apos;&lt;/a&gt;',
    );
  });
});

describe('renderBanner', () => {
  it('タイトルが入ったSVGになる', () => {
    const svg = renderBanner({ title: 'sagasu' });
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
    expect(svg).toContain('>sagasu</text>');
    expect(svg).toContain('viewBox="0 0 800 200"');
    expect(svg).toContain('aria-label="sagasu"');
  });

  it('タイトルはエスケープされる', () => {
    const svg = renderBanner({ title: '<script>"&"' });
    expect(svg).not.toContain('<script>');
    expect(svg).toContain('&lt;script&gt;');
  });

  it('空タイトルはエラー', () => {
    expect(() => renderBanner({ title: '   ' })).toThrow();
  });

  it('サブタイトルが2行目に出る', () => {
    const svg = renderBanner({ title: 'nobori', subtitle: 'SVGバナー生成' });
    expect(svg).toContain('SVGバナー生成');
  });

  it('サブタイトル省略時はtext要素が1つ', () => {
    const svg = renderBanner({ title: 'nobori' });
    expect(svg.match(/<text/g)).toHaveLength(1);
  });

  it('寸法とラジアスが反映される', () => {
    const svg = renderBanner({ title: 't', width: 1280, height: 320, radius: 0 });
    expect(svg).toContain('viewBox="0 0 1280 320"');
    expect(svg).toContain('rx="0"');
  });

  it('小さすぎる寸法は下限に丸める', () => {
    const svg = renderBanner({ title: 't', width: 10, height: 10 });
    expect(svg).toContain('viewBox="0 0 160 80"');
  });

  it('全テーマの配色が出力に含まれる', () => {
    for (const [name, theme] of Object.entries(THEMES)) {
      const svg = renderBanner({ title: 't', theme: name as keyof typeof THEMES });
      expect(svg).toContain(theme.from);
      expect(svg).toContain(theme.to);
      expect(svg).toContain(theme.text);
    }
  });

  it('パターン指定でpattern要素が入る', () => {
    for (const pattern of PATTERNS) {
      const svg = renderBanner({ title: 't', pattern });
      if (pattern === 'none') {
        expect(svg).not.toContain('<pattern');
      } else {
        expect(svg).toContain('<pattern id="pat"');
        expect(svg).toContain('fill="url(#pat)"');
      }
    }
  });

  it('左寄せはtext-anchorがstartになる', () => {
    expect(renderBanner({ title: 't', align: 'left' })).toContain('text-anchor="start"');
    expect(renderBanner({ title: 't', align: 'center' })).toContain('text-anchor="middle"');
  });

  it('長いタイトルはフォントが縮む', () => {
    const short = renderBanner({ title: 'abc' });
    const long = renderBanner({ title: 'とても長いリポジトリの名前すぎるバナー' });
    const sizeOf = (svg: string): number => Number(/font-size="(\d+)" font-weight/.exec(svg)?.[1]);
    expect(sizeOf(long)).toBeLessThan(sizeOf(short));
  });

  it('タグの開閉が釣り合っている', () => {
    const svg = renderBanner({ title: 'バランス', subtitle: '確認', pattern: 'seigaiha' });
    for (const tag of ['svg', 'defs', 'pattern', 'text']) {
      const open = svg.match(new RegExp(`<${tag}[\\s>]`, 'g'))?.length ?? 0;
      const close = svg.match(new RegExp(`</${tag}>`, 'g'))?.length ?? 0;
      expect(open).toBe(close);
    }
  });
});

describe('テーマと柄の拡充', () => {
  it('テーマは8種、柄はnone込みで8種', () => {
    expect(Object.keys(THEMES)).toHaveLength(8);
    expect(PATTERNS).toHaveLength(8);
  });

  it('すべての柄に表示名がある', () => {
    for (const pattern of PATTERNS) {
      expect(PATTERN_LABELS[pattern]).toBeTruthy();
    }
  });
});
