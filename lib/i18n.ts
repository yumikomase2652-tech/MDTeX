export type Locale = "ja" | "en";

export const messages = {
  ja: {
    new: "新規作成", open: "開く", save: "保存", exportPdf: "PDF出力",
    commands: "コマンド", help: "ヘルプ", settings: "設定", language: "言語",
    japanese: "日本語", english: "English", syntaxGuide: "構文ガイド",
    copySyntaxGuide: "構文ガイドをコピー", generateAi: "AI生成プロンプトをコピー", copied: "クリップボードにコピーしました",
    recovered: "前回の編集内容を復元しました", destructiveConfirm: "現在の内容は失われます。\n\n続行しますか？",
    markdownReport: "Markdownレポート", source: "Markdownソース", preview: "レポートプレビュー",
    write: "編集", previewTab: "プレビュー", live: "ライブ", uploadImage: "画像を挿入", toggleTheme: "テーマ切替",
    preparingPrint: "印刷を準備中", printNote: "PDF保存時は印刷倍率100%を推奨します。ブラウザのヘッダーとフッターをオフにしてください。",
    contents: "目次", figure: "図", table: "表", close: "閉じる",
    guideDescription: "Markdownに、レポート向けの数式・図表記法を追加できます。",
    searchCommands: "ReportMDコマンドを検索…", noCommands: "一致するコマンドはありません",
    paletteFooter: "↑↓ 移動 · Enter 挿入 · Esc 閉じる",
  },
  en: {
    new: "New", open: "Open", save: "Save", exportPdf: "Export PDF",
    commands: "Commands", help: "Help", settings: "Settings", language: "Language",
    japanese: "日本語", english: "English", syntaxGuide: "Syntax Guide",
    copySyntaxGuide: "Copy Syntax Guide", generateAi: "Copy AI Prompt", copied: "Copied to clipboard",
    recovered: "Recovered previous session", destructiveConfirm: "The current content will be lost.\n\nDo you want to continue?",
    markdownReport: "Markdown Report", source: "Markdown source", preview: "Report preview",
    write: "Write", previewTab: "Preview", live: "Live", uploadImage: "Upload image", toggleTheme: "Toggle theme",
    preparingPrint: "Preparing print", printNote: "For PDF export, use 100% print scale and disable browser headers and footers.",
    contents: "Contents", figure: "Figure", table: "Table", close: "Close",
    guideDescription: "Markdown with report-oriented math, figures, tables, and plots.",
    searchCommands: "Search ReportMD commands…", noCommands: "No matching commands",
    paletteFooter: "↑↓ Navigate · Enter Insert · Esc Close",
  },
} as const;

export function detectLocale(): Locale {
  return typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("ja") ? "ja" : "en";
}
