# Formula Markdown Editor

Next.js、TypeScript、Tailwind CSSで作られたMarkdown + KaTeX対応エディタです。左右分割プレビュー、スマホ表示、Markdown出力、A4 PDF出力に対応しています。

## 主な機能

- MarkdownとGitHub Flavored Markdownのリアルタイムプレビュー
- `$...$`のインライン数式と`$$...$$`のブロック数式
- KaTeXによる数式レンダリング
- A4・複数ページ対応のPDF出力
- Markdownファイル出力
- レスポンシブ表示とダークモード

## ローカル開発

必要環境:

- Node.js 24.x
- npm 11.x

```bash
npm ci
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## 品質チェック

デプロイ前に、Lint、型チェック、本番ビルドをまとめて実行できます。

```bash
npm run check
```

## Vercelへデプロイ

このプロジェクトはNext.jsの標準構成を使用しているため、`vercel.json`や追加の環境変数は不要です。

### Git連携でデプロイ

1. このプロジェクトをGitHub、GitLab、またはBitbucketへプッシュします。
2. [Vercel Dashboard](https://vercel.com/new)でリポジトリをインポートします。
3. Framework Presetが`Next.js`になっていることを確認します。
4. Root Directoryはリポジトリ直下のままにします。
5. Build Commandは`npm run build`、Install Commandは`npm ci`を使用します。
6. Deployを実行します。

以降は対象ブランチへのプッシュごとに自動デプロイされます。

### Vercel CLIでデプロイ

```bash
npx vercel
```

本番環境へ反映する場合:

```bash
npx vercel --prod
```

## Vercel設定

- Node.js: `package.json`の`engines.node`により24.xを使用
- Build Command: `npm run build`
- Output Directory: Next.jsが自動検出
- Environment Variables: 不要
- PDF生成: ブラウザ上で実行されるため、Vercel Functionsや追加ランタイムは不要

## 使用技術

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS 4
- `react-markdown`
- `remark-math` / `rehype-katex`
- `html2pdf.js`
