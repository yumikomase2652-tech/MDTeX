export type EditorMode = "markdown" | "latex";

export const DEFAULT_MARKDOWN = `# The beauty of mathematical thinking

Mathematics gives us a precise language for patterns, change, and structure. This editor lets you combine clear writing with beautifully typeset formulas.

## A familiar identity

Euler's identity connects five fundamental constants in one elegant equation:

$$e^{i\\pi} + 1 = 0$$

It follows from Euler's formula, $e^{ix} = \\cos x + i\\sin x$, when $x = \\pi$.

> “Mathematics is the music of reason.” — James Joseph Sylvester

## A useful integral

The Gaussian integral appears throughout probability and physics:

$$\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi}$$

### What you can write here

- **Markdown** for clear structure and emphasis
- Inline math such as $a^2 + b^2 = c^2$
- Display equations wrapped in double dollar signs
- Tables, lists, links, code, and images

| Symbol | Meaning |
| --- | --- |
| $\\pi$ | Circle constant |
| $e$ | Euler's number |
| $i$ | Imaginary unit |

Keep exploring.`;

export const DEFAULT_LATEX = String.raw`\documentclass[a4paper,11pt]{article}

\usepackage{amsmath,amssymb}
\usepackage{geometry}
\usepackage{enumitem}
\usepackage{xeCJK}

% MDTeXに同梱された日本語フォントです。
\setCJKmainfont{HaranoAjiMincho-Regular.otf}

\geometry{margin=22mm}

\title{レポートタイトル}
\author{氏名}
\date{\today}

\begin{document}

\maketitle

\section{目的}
本レポートでは，講義内容に基づき，基本的な理論と計算方法を整理する。

\section{理論}
基本式の例を以下に示す。

\[
E = mc^2
\]

また，応力は次式で表される。

\[
\sigma = \frac{F}{A}
\]

\section{計算}
以下の条件で計算を行う。

\begin{enumerate}[label=(\alph*)]
  \item 条件を整理する。
  \item 必要な式を立てる。
  \item 数値を代入して計算する。
\end{enumerate}

\section{考察}
得られた結果について，仮定や誤差の影響を考察する。

\section{結論}
本レポートでは，基本的な式を用いて現象を整理した。

\end{document}`;
