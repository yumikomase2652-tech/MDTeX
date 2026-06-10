import type { EditorMode } from "@/lib/default-content";

export type CommandSnippet = {
  id: string;
  label: string;
  description: string;
  snippet: string;
  keywords: string;
};

const sharedMath = [
  { id: "fraction", label: "Fraction", description: "Insert a fraction", snippet: String.raw`\frac{}{}`, keywords: "math frac fraction" },
  { id: "square-root", label: "Square Root", description: "Insert a square root", snippet: String.raw`\sqrt{}`, keywords: "math sqrt root" },
  { id: "sum", label: "Sum", description: "Insert a summation", snippet: String.raw`\sum_{}^{}`, keywords: "math sum sigma" },
  { id: "integral", label: "Integral", description: "Insert an integral", snippet: String.raw`\int_{}^{}`, keywords: "math integral" },
];

const markdownCommands: CommandSnippet[] = [
  { id: "h1", label: "Heading 1", description: "Top-level heading", snippet: "# ", keywords: "heading title h1" },
  { id: "h2", label: "Heading 2", description: "Section heading", snippet: "## ", keywords: "heading section h2" },
  { id: "h3", label: "Heading 3", description: "Subsection heading", snippet: "### ", keywords: "heading subsection h3" },
  { id: "bold", label: "Bold", description: "Bold text", snippet: "**text**", keywords: "bold strong" },
  { id: "italic", label: "Italic", description: "Italic text", snippet: "*text*", keywords: "italic emphasis" },
  { id: "inline-math", label: "Inline Math", description: "Inline KaTeX formula", snippet: "$x$", keywords: "math inline katex" },
  { id: "display-math", label: "Display Math", description: "Centered display formula", snippet: "$$\n\n$$", keywords: "math display block katex" },
  ...sharedMath,
  {
    id: "matrix",
    label: "Matrix",
    description: "Display a 2 × 2 matrix",
    snippet: "$$\n\\begin{pmatrix}\na & b \\\\\nc & d\n\\end{pmatrix}\n$$",
    keywords: "math matrix pmatrix",
  },
  { id: "table", label: "Table", description: "Markdown table", snippet: "| A | B |\n|---|---|\n|   |   |", keywords: "table grid" },
  {
    id: "image-url",
    label: "Image URL",
    description: "Insert a web image",
    snippet: "![alt text](https://example.com/image.png)",
    keywords: "image picture url",
  },
];

const latexCommands: CommandSnippet[] = [
  { id: "section", label: "Section", description: "Insert a report section", snippet: String.raw`\section{}`, keywords: "section heading" },
  { id: "subsection", label: "Subsection", description: "Insert a subsection", snippet: String.raw`\subsection{}`, keywords: "subsection heading" },
  {
    id: "equation",
    label: "Equation",
    description: "Numbered-style equation block",
    snippet: "\\begin{equation}\n\n\\end{equation}",
    keywords: "math equation",
  },
  {
    id: "align",
    label: "Align",
    description: "Aligned equations",
    snippet: "\\begin{align}\n\n\\end{align}",
    keywords: "math align equations",
  },
  ...sharedMath,
  {
    id: "matrix",
    label: "Matrix",
    description: "Insert a 2 × 2 matrix",
    snippet: "\\begin{pmatrix}\na & b \\\\\nc & d\n\\end{pmatrix}",
    keywords: "math matrix pmatrix",
  },
  {
    id: "itemize",
    label: "Itemize",
    description: "Bulleted list",
    snippet: "\\begin{itemize}\n  \\item \n\\end{itemize}",
    keywords: "list bullet itemize",
  },
  {
    id: "enumerate",
    label: "Enumerate",
    description: "Numbered list",
    snippet: "\\begin{enumerate}\n  \\item \n\\end{enumerate}",
    keywords: "list numbered enumerate",
  },
  {
    id: "table",
    label: "Table",
    description: "Simple LaTeX table",
    snippet: "\\begin{tabular}{|c|c|}\n\\hline\nA & B \\\\\n\\hline\n1 & 2 \\\\\n\\hline\n\\end{tabular}",
    keywords: "table tabular",
  },
  {
    id: "include-graphics",
    label: "Include Graphics",
    description: "Insert an image URL",
    snippet: String.raw`\includegraphics{https://example.com/image.png}`,
    keywords: "image includegraphics picture url",
  },
];

export function getCommands(mode: EditorMode) {
  return mode === "markdown" ? markdownCommands : latexCommands;
}
