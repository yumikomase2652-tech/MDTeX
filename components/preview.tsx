import katex from "katex";
import "katex/contrib/mhchem";
import React, { useId } from "react";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { compilePlotExpression } from "@/lib/plot-expression";
import { parseReport, type ReportHeading } from "@/lib/report-parser";
import { messages, type Locale } from "@/lib/i18n";

type PreviewProps = { content: string; locale: Locale; className?: string };

function Markdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      urlTransform={(url) => (url.startsWith("data:image/") ? url : defaultUrlTransform(url))}
      components={{
        // User-provided URLs and Data URLs must render without a Next Image allowlist.
        // eslint-disable-next-line @next/next/no-img-element
        img: ({ alt, ...props }) => <img {...props} alt={alt ?? ""} loading="lazy" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function MathBlock({ math, number }: { math: string; number?: number }) {
  const html = katex.renderToString(math, { displayMode: true, throwOnError: false, strict: "warn" });
  return (
    <div className="report-equation">
      <div className="report-equation-math" dangerouslySetInnerHTML={{ __html: html }} />
      {number && <span className="report-equation-number">({number})</span>}
    </div>
  );
}

function Toc({ headings, locale }: { headings: ReportHeading[]; locale: Locale }) {
  const label = messages[locale].contents;
  return (
    <nav className="report-toc" aria-label={label}>
      <h2>{label}</h2>
      <ol>
        {headings.map((heading) => (
          <li key={heading.id} className={`toc-level-${heading.level}`}>
            <a href={`#${heading.id}`}><span>{heading.number} {heading.title}</span></a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

const COLORS = ["#2563eb", "#dc2626", "#059669", "#7c3aed", "#d97706"];

function Plot({ config, error }: { config?: import("@/lib/plot-expression").PlotConfig; error?: string }) {
  const clipId = useId();
  if (!config || error) return <div className="report-plot-error">Plot error: {error ?? "Invalid plot"}</div>;
  try {
    const width = 720;
    const height = 400;
    const margin = { left: 62, right: 24, top: 36, bottom: 54 };
    const functions = config.series.map((series) => ({ ...series, evaluate: compilePlotExpression(series.expression) }));
    const sampled = functions.map((series) => ({
      ...series,
      points: Array.from({ length: 241 }, (_, index) => {
        const x = config.xmin + (config.xmax - config.xmin) * index / 240;
        const y = series.evaluate(x);
        return { x, y };
      }),
    }));
    const values = sampled.flatMap((series) => series.points.map((point) => point.y)).filter((value) => Number.isFinite(value) && Math.abs(value) < 1e6);
    let ymin = Math.min(...values);
    let ymax = Math.max(...values);
    if (!values.length) throw new Error("No finite values");
    if (ymin === ymax) { ymin -= 1; ymax += 1; }
    const padding = (ymax - ymin) * 0.08;
    ymin -= padding;
    ymax += padding;
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    const sx = (x: number) => margin.left + (x - config.xmin) / (config.xmax - config.xmin) * plotWidth;
    const sy = (y: number) => margin.top + (ymax - y) / (ymax - ymin) * plotHeight;
    const xAxisY = ymin <= 0 && ymax >= 0 ? sy(0) : margin.top + plotHeight;
    const yAxisX = config.xmin <= 0 && config.xmax >= 0 ? sx(0) : margin.left;

    return (
      <svg className="report-plot" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={config.title || "Plot"}>
        <rect x={margin.left} y={margin.top} width={plotWidth} height={plotHeight} fill="white" stroke="#d1d5db" />
        <line x1={margin.left} y1={xAxisY} x2={margin.left + plotWidth} y2={xAxisY} stroke="#6b7280" />
        <line x1={yAxisX} y1={margin.top} x2={yAxisX} y2={margin.top + plotHeight} stroke="#6b7280" />
        {sampled.map((series, seriesIndex) => {
          let drawing = false;
          const path = series.points.flatMap((point) => {
            if (!Number.isFinite(point.y)) { drawing = false; return []; }
            const command = drawing ? "L" : "M";
            drawing = true;
            return `${command}${sx(point.x).toFixed(2)},${sy(point.y).toFixed(2)}`;
          }).join(" ");
          return <path key={series.label} d={path} fill="none" stroke={COLORS[seriesIndex % COLORS.length]} strokeWidth="2.2" clipPath={`url(#${clipId})`} />;
        })}
        <defs><clipPath id={clipId}><rect x={margin.left} y={margin.top} width={plotWidth} height={plotHeight} /></clipPath></defs>
        <text x={width / 2} y="20" textAnchor="middle" fontSize="15" fontWeight="600">{config.title}</text>
        <text x={width / 2} y={height - 10} textAnchor="middle" fontSize="13">{config.xlabel}</text>
        <text x="16" y={height / 2} textAnchor="middle" fontSize="13" transform={`rotate(-90 16 ${height / 2})`}>{config.ylabel}</text>
        <text x={margin.left} y={height - 31} textAnchor="middle" fontSize="10">{config.xmin}</text>
        <text x={margin.left + plotWidth} y={height - 31} textAnchor="middle" fontSize="10">{config.xmax}</text>
        {sampled.map((series, index) => (
          <g key={`legend-${series.label}`} transform={`translate(${margin.left + index * 112}, ${height - 27})`}>
            <line x1="0" y1="0" x2="18" y2="0" stroke={COLORS[index % COLORS.length]} strokeWidth="2.2" />
            <text x="23" y="4" fontSize="10">{series.label}</text>
          </g>
        ))}
      </svg>
    );
  } catch (plotError) {
    return <div className="report-plot-error">Plot error: {plotError instanceof Error ? plotError.message : "Invalid expression"}</div>;
  }
}

export function Preview({ content, locale, className = "preview-content markdown-body" }: PreviewProps) {
  const report = parseReport(content);
  const copy = messages[locale];
  return (
    <article className={className}>
      {report.blocks.map((block, index) => {
        if (block.type === "markdown") return <Markdown key={index} content={block.content} />;
        if (block.type === "heading") {
          const tag = `h${block.heading.level}` as keyof React.JSX.IntrinsicElements;
          return React.createElement(tag, { id: block.heading.id, key: index }, <><span className="heading-number">{block.heading.number}</span> {block.heading.title}</>);
        }
        if (block.type === "toc") return <Toc key={index} headings={report.headings} locale={locale} />;
        if (block.type === "equation") return <MathBlock key={index} math={block.math} number={block.number} />;
        if (block.type === "pagebreak") return <div key={index} className="report-pagebreak" aria-label="Page break" />;
        if (block.type === "figure") return <figure key={index} className="report-figure"><Markdown content={block.content} /><figcaption>{block.number && `${copy.figure}${locale === "en" ? " " : ""}${block.number} `}{block.caption}</figcaption></figure>;
        if (block.type === "table") return <figure key={index} className="report-table"><Markdown content={block.content} /><figcaption>{block.number && `${copy.table}${locale === "en" ? " " : ""}${block.number} `}{block.caption}</figcaption></figure>;
        return <figure key={index} className="report-figure report-plot-figure"><Plot config={block.config} error={block.error} /><figcaption>{block.number && `${copy.figure}${locale === "en" ? " " : ""}${block.number} `}{block.caption || block.config?.title}</figcaption></figure>;
      })}
    </article>
  );
}
