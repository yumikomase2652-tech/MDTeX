export const DEFAULT_MARKDOWN = String.raw`# 波動現象に関するレポート

[toc]

## 目的

MarkdownとLaTeX記法を用いて、波動の基本的な性質を整理する。

## 理論

波の変位を次式で表す。

$$
f(x,t)=\exp\left(-(x-t)^2\right)
$$

::equation[エネルギーと質量の関係]
E=mc^2
::

化学反応式も本文中に記述できる。例えば $\ce{CH4 + 2O2 -> CO2 + 2H2O}$ である。

## 計算結果

::table[測定結果]
| 時刻 | 変位 |
| --- | ---: |
| 0.0 | 1.000 |
| 1.0 | 0.368 |
::

::plot[波の伝わり方]
title: Q2の波の伝わり方
xlabel: x
ylabel: f
xmin: -4
xmax: 4
functions:
- label: t=0
  expr: exp(-x^2)
- label: t=1
  expr: exp(-(x-1)^2)
::

---pagebreak---

## 考察

グラフから、波形を保ったまま正の方向へ移動することが分かる。

## 結論

ReportMDでは、Markdownを中心に数式・図表・グラフを含むレポートを作成できる。`;
