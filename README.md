# MDTeX

Markdown + LaTeX 数式 + PDF 出力に対応したWebエディタ。

🌐 Live Demo
https://mdtex-app.vercel.app

## Features

* Markdown
* KaTeX数式
* リアルタイムプレビュー
* PDF出力
* ダークモード
* モバイル対応
* PWA対応（iPhone / Androidのホーム画面に追加可能）

## PWA Installation

- iPhone / iPad: Safariの共有メニューから「ホーム画面に追加」を選択
- Android / Desktop: 対応ブラウザの「アプリをインストール」を選択

MDTeXはログイン、クラウド保存、自動保存を行いません。必要なタイミングで`.md`、`.tex`、またはPDFを書き出してください。

## PDF Export

PDF本文は10.5ptの明朝体 / Times New Roman系フォントを使用します。KaTeX数式はブラウザ印刷でテキストとして保持されます。

## Development

```bash
npm install
npm run dev
```

Open:

http://localhost:3000
