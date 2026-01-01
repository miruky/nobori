<img src="public/logo.svg" width="88" align="right" alt="noboriのロゴ">

# nobori

[![CI](https://github.com/miruky/nobori/actions/workflows/ci.yml/badge.svg)](https://github.com/miruky/nobori/actions/workflows/ci.yml)
[![Deploy](https://github.com/miruky/nobori/actions/workflows/deploy.yml/badge.svg)](https://github.com/miruky/nobori/actions/workflows/deploy.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

**README用のSVGバナーをブラウザだけで生成する。外部フォント不要、5テーマ+6種の柄、ライブプレビュー付き。**

公開ページ: https://miruky.github.io/nobori/

## 概要

READMEの先頭に置くバナー画像は、画像編集ツールで作るとリポジトリ名が変わるたびに作り直しになり、文字情報なのに差分も追えない。noboriはタイトルとテーマを選ぶだけでSVGのバナーを生成する。出力は自己完結したSVGテキストで、リポジトリにコミットすれば差分レビューもできる。

テーマは藍・深緑・夕暮れ・墨・桜の5種、柄は水玉・方眼・斜線・波・青海波から選べる。書体はシステムフォントスタック指定なので、外部フォントの読み込みがなく、どの環境でも即座に描画される。タイトルの長さに応じて文字サイズが自動で縮む。

## アーキテクチャ

![処理の流れ](docs/architecture.svg)

中心は `renderBanner(options): string` という純関数で、UIはこれに入力を渡してプレビュー・ダウンロード・コピーに同じ文字列を使うだけの薄い層になっている。テストは生成されたSVG文字列に対して行い、DOMを必要としない。

## 技術スタック

| 領域                 | 採用技術                      |
| -------------------- | ----------------------------- |
| 言語                 | TypeScript 5(strict)          |
| ビルド               | Vite                          |
| テスト               | Vitest                        |
| リンタ・フォーマッタ | ESLint + Prettier             |
| CI / 配信            | GitHub Actions + GitHub Pages |

## 使い方

1. [公開ページ](https://miruky.github.io/nobori/)でタイトル・サブタイトル・テーマ・柄・サイズ・配置を選ぶ
2. プレビューを確認して「SVGをダウンロード」
3. リポジトリに置いてREADMEから参照する

```markdown
![バナー](docs/banner.svg)
```

生成されるSVGの構造:

```xml
<svg xmlns="..." viewBox="0 0 800 200" role="img" aria-label="タイトル">
  <defs>
    <linearGradient id="bg">…</linearGradient>
    <pattern id="pat">…</pattern>   <!-- 柄を選んだときだけ -->
  </defs>
  <rect fill="url(#bg)"/>
  <text>タイトル</text>
</svg>
```

タイトル・サブタイトルはXMLエスケープされるため、`<` や `&` を含む文字列も安全に埋め込まれる。

設定はURLのハッシュ(`#t=...&th=...`)に保存される。「共有リンクをコピー」でその時の見た目をそのまま渡せ、開いた相手は同じバナーから調整を始められる。手で書き換えられた未知のテーマや柄は読み込み時に既定へ落ちる。

## プロジェクト構成

- `src/`
  - `banner.ts` — テーマ定義とSVG生成(純関数)
  - `banner.test.ts` — エスケープ・寸法・全テーマ×全柄のテスト
  - `share.ts` + `share.test.ts` — 設定とURLハッシュの相互変換(純関数)
  - `main.ts` — フォームとプレビューの結線
- `public/logo.svg` — ロゴ兼ファビコン
- `.github/workflows/` — CI(lint・テスト・ビルド)とPagesデプロイ

## はじめ方

前提: Node.js 22以上。

```
git clone https://github.com/miruky/nobori.git
cd nobori
npm install
npm run dev     # 開発サーバー
npm test        # Vitest
npm run lint    # ESLint
npm run build   # 型チェック + ビルド
```

## 設計方針

**SVGはテキストとして生成する。** DOM APIで組み立てず文字列連結で出すのは、出力がそのままファイルになる(プレビューに使ったものとダウンロードされるものが同一)ことを保証するためだ。エスケープは生成側の責務として `escapeXml` に集約した。

**外部リソースを埋め込まない。** Webフォントや画像をdata URIで抱えるとSVGが肥大化し、ライセンスの問題も生じる。システムフォント指定は環境で字形が多少変わる欠点があるが、バナー用途では許容できる。

**柄は控えめに。** パターンの不透明度は0.25〜0.35に固定し、タイトルの可読性を柄より優先する。文字と背景のコントラストはテーマ側で確保している。

## ライセンス

[MIT](LICENSE)
