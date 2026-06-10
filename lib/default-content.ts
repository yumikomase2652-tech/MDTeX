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

export const DEFAULT_LATEX = String.raw`\title{基礎力学実験レポート}
\author{理工学部 物理学科 山田 太郎}
\date{2026年6月10日}

\maketitle

\section{目的}
ニュートンの運動方程式を用いて、力・質量・加速度の関係を確認する。

\section{理論}
物体に働く力と加速度の関係は次式で表される。

\begin{equation}
F = ma
\end{equation}

また、断面積 $A$ に力 $F$ が作用するとき、応力は次式となる。

\begin{equation}
\sigma = \frac{F}{A}
\end{equation}

\subsection{測定条件}
\begin{itemize}
  \item 質量を一定にして力を変化させる
  \item 加速度を3回測定して平均を求める
\end{itemize}

\section{計算}
\begin{align}
F_1 &= m a_1 \\
F_2 &= m a_2
\end{align}

\begin{tabular}{|c|c|}
\hline
力 F [N] & 加速度 a [m/s^2] \\
\hline
1.0 & 0.52 \\
2.0 & 1.03 \\
\hline
\end{tabular}

\section{考察}
測定結果は理論値とおおむね一致した。摩擦力と測定誤差が差の主な要因だと考えられる。

\section{結論}
力と加速度の比例関係を確認し、運動方程式 $F=ma$ の妥当性を検証できた。`;
