# MDTeX

MDTeXは、Markdown・LaTeX数式・PDF出力に対応した、ブラウザで使えるレポート作成エディタです。

アカウント登録やクラウド保存を使わず、技術メモや理系レポートを作成できます。数式はKaTeXで素早くプレビューし、完成した文書はMarkdown・LaTeX・PDFとして書き出せます。

## Live Demo

[https://mdtex-app.vercel.app](https://mdtex-app.vercel.app)

## Features

- 見出し・リスト・表・画像・コードに対応したMarkdownモード
- SwiftLaTeX（XeTeX + dvipdfmx）による実験的なブラウザ内LaTeX PDFコンパイル
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

> LaTeX compile is experimental. 初回はWASMとTeX Liveファイルの読み込みに時間がかかります。LaTeXソースはブラウザ内で処理され、サーバーへ送信されません。

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
- SwiftLaTeX / WebAssembly

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
- LaTeX文書: XeTeX + dvipdfmxによるブラウザ内PDFコンパイルとダウンロード

MarkdownのPDF出力はテキストを選択可能な状態で保ち、KaTeX数式もブラウザ印刷で可能な限りきれいに出力します。

### Experimental LaTeX Compile

LaTeXモードの`Compile PDF`は、`public/swiftlatex`から配信されるSwiftLaTeXのXeTeX/Dvipdfmx WebAssembly Workerを使用します。

1. `.tex`ソースをブラウザ内のXeTeXでXDVへコンパイル
2. XDVをブラウザ内のdvipdfmxでPDFへ変換
3. PDF Blobをアプリ内でプレビューし、`Download PDF`で保存

LaTeXソースそのものは外部へ送信されません。ただし、必要なTeX Liveクラス・パッケージ・フォントは設定されたTexlive-OnDemandサービスからオンデマンド取得します。そのため初回コンパイルにはインターネット接続が必要です。

使用するエンドポイントはVercelまたは`.env.local`で設定できます。

```bash
NEXT_PUBLIC_SWIFTLATEX_TEXLIVE_ENDPOINT=https://your-texlive-server.example.com/
```

未設定時はTeXlyre公開設定の`https://texlive.texlyre.org/`を使用します。ただし、2026-06-19の調査時点では公開SwiftLaTeX/TeXlyreパッケージサービスが停止しており、デフォルト設定のコンパイルは失敗する可能性があります。確実な運用には[SwiftLaTeX Texlive-OnDemand](https://github.com/SwiftLaTeX/Texlive-Ondemand)のセルフホストが必要です。

日本語の初期テンプレートは`article + xeCJK`を使用します。日本語フォントのHarano Aji MinchoはSIL OFLに基づいてアプリへ同梱し、外部フォントサービスには依存しません。現在の制限は次のとおりです。

- `jsarticle`、pLaTeX、upLaTeXの完全互換は保証しません
- SwiftLaTeXサービスにないクラス・パッケージ・フォントはコンパイルできません
- 日本語の禁則処理やフォント品質はデスクトップTeX環境と異なる場合があります
- 初回のWASM/パッケージ読み込みは重く、モバイルでは時間がかかる場合があります
- コンパイル失敗時は`Log`タブにXeTeXログと検出できた行番号を表示します
- TeX Liveサービスへ接続できない場合、WASMが読み込めてもクラス・パッケージ取得で失敗します

VercelではWASMとWorkerを通常の静的ファイルとして配信するため、サーバー側LaTeX環境は不要です。

#### Engine research

- SwiftLaTeX: 約4MBのXeTeX/dvipdfmx WASMを同梱できるため採用。ただしTeX Liveファイルサーバーが別途必要
- Tectonic: 公式プロジェクトにブラウザ配布用の安定したJavaScript/WASM SDKがないため今回は不採用
- TeXlyre BusyTeX: 完全ブラウザ実行は可能だが、v1.1.1の公式資産が圧縮状態で約504MBあり、MDTeX/Vercelへの同梱には過大なため不採用
- LaTeX.js: HTML生成が中心で、正確なPDFコンパイル用途ではないため不採用

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
- `jsarticle` / upLaTeX相当の日本語組版対応強化
- TeX Live資産のキャッシュとオフラインコンパイル改善

## License

MDTeX本体はMITライセンスです。`public/swiftlatex`の第三者エンジン資産はSwiftLaTeXのライセンスに従います。詳細は`public/swiftlatex/NOTICE.txt`と`LICENSE.txt`を参照してください。
