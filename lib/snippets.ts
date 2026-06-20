export type CommandSnippet = {
  id: string;
  category: "Write" | "Math" | "Report";
  label: string;
  description: string;
  snippet: string;
  keywords: string;
};

export const commands: CommandSnippet[] = [
  { id: "h1", category: "Write", label: "Heading 1", description: "Top-level report section", snippet: "# ", keywords: "heading title h1" },
  { id: "h2", category: "Write", label: "Heading 2", description: "Report subsection", snippet: "## ", keywords: "heading section h2" },
  { id: "bold", category: "Write", label: "Bold", description: "Bold text", snippet: "**text**", keywords: "bold strong" },
  { id: "italic", category: "Write", label: "Italic", description: "Italic text", snippet: "*text*", keywords: "italic emphasis" },
  { id: "inline-math", category: "Math", label: "Inline Math", description: "Inline KaTeX formula", snippet: "$x$", keywords: "math inline katex" },
  { id: "display-math", category: "Math", label: "Display Math", description: "Unnumbered display formula", snippet: "$$\n\n$$", keywords: "math display block" },
  { id: "equation-number", category: "Math", label: "Equation Number", description: "Numbered equation block", snippet: "::equation\nE = mc^2\n::", keywords: "math equation number" },
  { id: "align", category: "Math", label: "Align", description: "Aligned equations", snippet: "\\begin{align}\na &= b + c \\\\\nd &= e + f\n\\end{align}", keywords: "math align equations" },
  { id: "cases", category: "Math", label: "Cases", description: "Piecewise expression", snippet: "\\begin{cases}\nx & x \\ge 0 \\\\\n-x & x < 0\n\\end{cases}", keywords: "math cases piecewise" },
  { id: "matrix", category: "Math", label: "Matrix", description: "Plain matrix", snippet: "\\begin{matrix}\na & b \\\\\nc & d\n\\end{matrix}", keywords: "math matrix" },
  { id: "pmatrix", category: "Math", label: "PMatrix", description: "Parenthesized matrix", snippet: "\\begin{pmatrix}\na & b \\\\\nc & d\n\\end{pmatrix}", keywords: "math matrix parentheses" },
  { id: "bmatrix", category: "Math", label: "BMatrix", description: "Bracketed matrix", snippet: "\\begin{bmatrix}\na & b \\\\\nc & d\n\\end{bmatrix}", keywords: "math matrix brackets" },
  { id: "chemical", category: "Math", label: "Chemical Equation", description: "mhchem chemical equation", snippet: "$\\ce{CH4 + 2O2 -> CO2 + 2H2O}$", keywords: "chemistry chemical mhchem ce" },
  { id: "figure", category: "Report", label: "Figure", description: "Numbered figure", snippet: "::figure[図の説明]\n![alt text](https://example.com/image.png)\n::", keywords: "figure image numbered" },
  { id: "figure-star", category: "Report", label: "Figure (No Number)", description: "Unnumbered figure", snippet: "::figure*[参考図]\n![alt text](https://example.com/image.png)\n::", keywords: "figure image unnumbered" },
  { id: "table", category: "Report", label: "Table", description: "Numbered table", snippet: "::table[測定結果]\n| A | B |\n|---|---|\n| 1 | 2 |\n::", keywords: "table numbered" },
  { id: "table-star", category: "Report", label: "Table (No Number)", description: "Unnumbered table", snippet: "::table*[参考表]\n| A | B |\n|---|---|\n| 1 | 2 |\n::", keywords: "table unnumbered" },
  { id: "plot", category: "Report", label: "Plot", description: "Numbered function plot", snippet: "::plot[波の伝わり方]\ntitle: Q2の波の伝わり方\nxlabel: x\nylabel: f\nxmin: -4\nxmax: 4\nfunctions:\n- label: t=0\n  expr: exp(-x^2)\n- label: t=1\n  expr: exp(-(x-1)^2)\n::", keywords: "plot graph function numbered" },
  { id: "plot-star", category: "Report", label: "Plot (No Number)", description: "Unnumbered function plot", snippet: "::plot*[参考グラフ]\ntitle: 関数グラフ\nxlabel: x\nylabel: y\nxmin: -4\nxmax: 4\nfunctions:\n- label: f(x)\n  expr: sin(x)\n::", keywords: "plot graph unnumbered" },
  { id: "toc", category: "Report", label: "TOC", description: "Automatic table of contents", snippet: "[toc]", keywords: "toc contents outline" },
  { id: "pagebreak", category: "Report", label: "Page Break", description: "Start a new PDF page", snippet: "---pagebreak---", keywords: "page break print pdf" },
];
