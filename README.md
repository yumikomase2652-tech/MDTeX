# ReportMD

ReportMDは、Markdownで書けるLaTeX風レポート作成アプリです。

環境構築やログインをせず、ブラウザだけで数式・化学式・図表・グラフを含む学生レポートを作成し、A4 PDFとして保存できます。

## Features

- Markdown専用のプレーンテキストエディタ
- KaTeXによるインライン数式・ディスプレイ数式
- `align`、`gather`、`cases`、各種matrixなどのamsmath風環境
- mhchemによる化学式（`\ce{...}`）
- 数式・図・表・plotの自動番号
- 見出し番号と`[toc]`による自動目次
- 関数式からSVGグラフを描くplotブロック
- A4・明朝体・10.5ptのブラウザ印刷PDF
- New / Open / Saveを中心にしたシンプルなファイル操作
- `.md`・`.markdown`・`.txt`の読み込みと`.md`保存
- 前回編集中だった内容のセッション復元
- 日本語・EnglishのUI、目次、図表番号
- Syntax GuideとAI生成用プロンプトのコピー
- PWA、ダークモード、モバイル対応
- ログイン・クラウド・DB不要

## Syntax

通常のMarkdownに加えて、レポート向け構文を利用できます。アプリ内のHelpから完全なSyntax Guideを開けます。

### Math

```text
$E=mc^2$

$$
\int_0^1 x^2\,dx
$$

::equation[エネルギーと質量の関係]
E=mc^2
::
```

番号なしの独自数式ブロックには`::equation*`を使用します。通常の`$$...$$`も番号なしです。

### Chemistry

```text
$\ce{H2O}$

$$
\ce{CH4 + 2O2 -> CO2 + 2H2O}
$$
```

### Figure And Table

```text
::figure[波の伝わり方]
![wave](image.png)
::

::table[測定結果]
| A | B |
|---|---|
| 1 | 2 |
::
```

番号なしは`::figure*`、`::table*`を使用します。

### Plot

```text
::plot[波の伝わり方]
title: Q2の波の伝わり方
xlabel: x
ylabel: f
xmin: -4
xmax: 4
functions:
- label: t=0
  expr: exp(-x^2)
- label: t=1
  expr: exp(-(x-1)^2)
::
```

plot式では`exp`、`sin`、`cos`、`tan`、`sqrt`、`log`、`x`、`^`、四則演算を使用できます。TikZは対応していません。

### TOC And Page Break

```text
[toc]

---pagebreak---
```

## PDF Style

- A4縦、余白22mm
- 本文10.5pt、行間1.4
- 日本語は明朝体、英数字はTimes New Roman系
- 見出し番号、目次、数式、化学式、図表番号
- テキスト選択可能なブラウザ印刷PDF

印刷ダイアログでは倍率100%を推奨します。ブラウザが追加するヘッダーとフッターはオフにしてください。

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- React Markdown
- KaTeX / mhchem

## Getting Started

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000)を開きます。

```bash
npm run check
```

`check`はESLint、TypeScript、Next.js production buildを実行します。

## Files And Session Recovery

実際の保存は画面のSaveから`.md`ファイルとして行います。Openは`.md`、`.markdown`、`.txt`を読み込みます。NewとOpenの前には、現在の編集内容を置き換える確認が表示されます。

localStorageは前回編集中だった1件のセッション復元だけに利用します。Documents一覧、クラウド同期、アカウント、端末上の元ファイルへの直接上書きはありません。

旧MDTeX / ReportMD Documents形式のデータが残っている場合は、最後に開いていた内容だけを復元セッションへ引き継ぎます。

## AI Assistance

Helpの「Copy Syntax Guide」と「Copy AI Prompt」（日本語UIでは「構文ガイドをコピー」「AI生成プロンプトをコピー」）から、仕様全文またはAI向けプロンプトをコピーできます。AIサービスへの自動送信やAPI接続は行いません。

## Limitations

- 本物のTeX/LaTeXコンパイルは行いません
- 任意のLaTeXパッケージ、documentclass、TikZには対応しません
- PDFのページ番号はブラウザ印刷エンジンのCSS page counter対応状況に依存します
- 複雑なamsmath構文はKaTeXの対応範囲に限られます

## License

MIT
