# MDTeX

MDTeXは、Markdown・LaTeX数式・PDF出力に対応した、ブラウザで使えるレポート作成エディタです。

アカウント登録やクラウド保存を使わず、技術メモや理系レポートを作成できます。数式はKaTeXで素早くプレビューし、完成した文書はMarkdown・LaTeX・PDFとして書き出せます。

## Live Demo

[https://mdtex-app.vercel.app](https://mdtex-app.vercel.app)

## Features

- 見出し・リスト・表・画像・コードに対応したMarkdownモード
- レポート向けの簡易プレビューを備えたLaTeXモード
- KaTeXによる高速な数式レンダリング
- インライン数式（`$...$`）とブロック数式（`$$...$$`）
- ブラウザ印刷を利用した、テキスト選択可能なPDF出力
- Markdown（`.md`）・LaTeX（`.tex`）の書き出し
- `.md`・`.markdown`・`.tex`・`.txt`ファイルの読み込み
- 文書の作成・複製・削除ができるSaved Documents管理
- ON/OFFを切り替えられるブラウザ内自動保存
- デスクトップ・モバイルへインストールできるPWA対応
- ダークモード・スマホ対応
- ログイン・アカウント・DB・クラウド保存不要

> 現在のLaTeX Previewは簡易表示で、`documentclass`の文字サイズを再現しません。Compile PDFは準備中です。正確な出力には、書き出した`.tex`ファイルをTeX環境でコンパイルしてください。

## Screenshots

スクリーンショットは今後追加予定です。

<!-- Example:
![MDTeX editor](./docs/screenshots/editor.png)
![MDTeX mobile view](./docs/screenshots/mobile.png)
-->

## Why MDTeX?

Markdownは手軽に文章を書ける一方で、数式を多く含む文書には向かないことがあります。TeXは強力ですが、小さなレポートを書くためには環境構築や学習の負担が大きくなりがちです。

また、既存のレポート作成環境は高機能な分だけ重かったり、ログインやクラウド同期が必要だったりします。MDTeXは、その中間となるシンプルな選択肢を目指しています。

- Markdownで手軽に文書構造を作れる
- LaTeXとKaTeXで数式を分かりやすく記述できる
- ブラウザだけで軽量にレポートを書ける
- ログインやクラウドに依存せず、端末内で文書を管理できる

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- KaTeX

## Getting Started

必要な環境:

- Node.js 24
- npm

依存関係をインストールし、開発サーバーを起動します。

```bash
npm install
npm run dev
```

ブラウザで[http://localhost:3000](http://localhost:3000)を開いてください。

本番用ビルド:

```bash
npm run build
```

## Export

MDTeXは以下の形式で書き出せます。

- Markdown (`.md`)
- LaTeX (`.tex`)
- Markdown文書: ブラウザの印刷ダイアログを利用したPDF
- LaTeX文書: `.tex`を書き出してTeX環境でコンパイル（アプリ内Compile PDFは準備中）

MarkdownのPDF出力はテキストを選択可能な状態で保ち、KaTeX数式もブラウザ印刷で可能な限りきれいに出力します。

## Local Storage

- 文書とAuto Save設定は、ブラウザの`localStorage`に保存されます
- Saved Documentsはアプリを再読み込みしても保持されます
- 読み込んだローカルファイルを直接上書きすることはありません
- クラウド同期は行いません
- ログインやアカウント作成は不要です

文書は現在使用しているブラウザ内だけに保存されます。重要な文書は定期的に書き出してください。

## Roadmap

- 画像挿入・サイズ調整の改善
- PDF品質のさらなる改善
- レポートテンプレート機能
- 数式スニペット・コマンドの拡充
- PWA機能の強化
- SwiftLaTeXなどを利用したブラウザ内LaTeX PDFコンパイル

## License

MIT
