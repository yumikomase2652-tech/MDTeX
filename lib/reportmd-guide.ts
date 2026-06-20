import type { Locale } from "@/lib/i18n";

const syntax = {
  math: "Inline: $x^2$\n\nDisplay:\n$$\nx^2 + y^2 = 1\n$$\n\nNumbered:\n::equation[description]\nE=mc^2\n::",
  amsmath: "\\begin{align}\na &= b + c \\\\\nd &= e + f\n\\end{align}\n\n\\begin{cases}\nx & x \\ge 0 \\\\\n-x & x < 0\n\\end{cases}",
  chemistry: "$\\ce{H2O}$\n\n$$\n\\ce{CH4 + 2O2 -> CO2 + 2H2O}\n$$",
  figure: "::figure[caption]\n![alt](image.png)\n::\n\n::figure*[no number]\n![alt](image.png)\n::",
  table: "::table[caption]\n| A | B |\n|---|---|\n| 1 | 2 |\n::",
  plot: "::plot[caption]\ntitle: Function plot\nxlabel: x\nylabel: y\nxmin: -4\nxmax: 4\nfunctions:\n- label: f(x)\n  expr: exp(-x^2)\n::",
  document: "[toc]\n\n---pagebreak---",
};

export function getGuideSections(locale: Locale) {
  const labels = locale === "ja"
    ? ["数式", "amsmath", "化学式", "図", "表", "グラフ", "文書"]
    : ["Math", "amsmath", "Chemistry", "Figure", "Table", "Plot", "Document"];
  return Object.values(syntax).map((content, index) => ({ title: labels[index], content }));
}

export function getSyntaxGuideText(locale: Locale) {
  const intro = locale === "ja"
    ? "ReportMD Syntax Guide\n\nReportMDはMarkdownでLaTeX風レポートを作るアプリです。"
    : "ReportMD Syntax Guide\n\nReportMD creates LaTeX-style reports with Markdown.";
  return `${intro}\n\n${getGuideSections(locale).map(({ title, content }) => `## ${title}\n\n${content}`).join("\n\n")}\n\nPlot expressions: exp sin cos tan sqrt log x ^ + - * /`;
}

export function getAiPrompt(locale: Locale) {
  if (locale === "ja") return `ReportMD形式で文書を生成してください。

利用可能な機能:
- Markdown見出し
- KaTeX数式
- mhchem化学式
- figureブロック
- tableブロック
- plotブロック
- [toc]
- ---pagebreak---

ReportMD本文だけを出力してください。
構文の説明は不要です。
コードフェンスで囲まないでください。

${getSyntaxGuideText(locale)}`;
  return `Generate the document in ReportMD format.

Available features:
- Markdown headings
- KaTeX math
- mhchem chemistry
- figure blocks
- table blocks
- plot blocks
- [toc]
- ---pagebreak---

Output only ReportMD content.
Do not explain the syntax.
Do not wrap the result in code fences.

${getSyntaxGuideText(locale)}`;
}
