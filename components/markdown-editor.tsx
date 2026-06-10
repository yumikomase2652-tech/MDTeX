"use client";

import {
  Bold,
  Check,
  Code2,
  Download,
  Eye,
  FileDown,
  FileText,
  Heading2,
  Italic,
  Link,
  List,
  Moon,
  Quote,
  Sigma,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

const starterMarkdown = `# The beauty of mathematical thinking

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
- Tables, lists, links, and code

| Symbol | Meaning |
| --- | --- |
| $\\pi$ | Circle constant |
| $e$ | Euler's number |
| $i$ | Imaginary unit |

Keep exploring.`;

type Tool = {
  icon: typeof Bold;
  label: string;
  before: string;
  after?: string;
  fallback?: string;
};

const tools: Tool[] = [
  { icon: Heading2, label: "見出し", before: "## ", fallback: "見出し" },
  { icon: Bold, label: "太字", before: "**", after: "**", fallback: "太字" },
  { icon: Italic, label: "斜体", before: "_", after: "_", fallback: "斜体" },
  { icon: Link, label: "リンク", before: "[", after: "](https://)", fallback: "リンク" },
  { icon: Quote, label: "引用", before: "> ", fallback: "引用" },
  { icon: List, label: "リスト", before: "- ", fallback: "リスト項目" },
  { icon: Code2, label: "コード", before: "`", after: "`", fallback: "code" },
  { icon: Sigma, label: "数式", before: "$$", after: "$$", fallback: "E = mc^2" },
];

export function MarkdownEditor() {
  const [markdown, setMarkdown] = useState(starterMarkdown);
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const [dark, setDark] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [saved, setSaved] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pdfDocumentRef = useRef<HTMLElement>(null);

  const stats = useMemo(() => {
    const words = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;
    return { words, chars: markdown.length };
  }, [markdown]);

  useEffect(() => {
    setSaved(false);
    const timer = window.setTimeout(() => setSaved(true), 700);
    return () => window.clearTimeout(timer);
  }, [markdown]);

  function insertSyntax(tool: Tool) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = markdown.slice(start, end) || tool.fallback || "";
    const addition = `${tool.before}${selected}${tool.after ?? ""}`;
    const next = `${markdown.slice(0, start)}${addition}${markdown.slice(end)}`;

    setMarkdown(next);
    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + addition.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  function downloadMarkdown() {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "formula-note.md";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function printPdf() {
    const pdfDocument = pdfDocumentRef.current;
    if (!pdfDocument || isExportingPdf) return;

    setIsExportingPdf(true);
    const printFrame = document.createElement("iframe");
    printFrame.title = "PDF print document";
    printFrame.style.position = "fixed";
    printFrame.style.right = "100%";
    printFrame.style.bottom = "100%";
    printFrame.style.width = "1px";
    printFrame.style.height = "1px";
    printFrame.style.border = "0";
    document.body.appendChild(printFrame);

    try {
      const printWindow = printFrame.contentWindow;
      const printDocument = printFrame.contentDocument;
      if (!printWindow || !printDocument) {
        throw new Error("印刷用ドキュメントを作成できませんでした。");
      }

      printDocument.open();
      printDocument.write("<!doctype html><html lang=\"ja\"><head><title>document.pdf</title></head><body></body></html>");
      printDocument.close();

      const stylesheetLoads = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')).map(
        (stylesheet) =>
          new Promise<void>((resolve) => {
            const clone = stylesheet.cloneNode(true) as HTMLLinkElement;
            clone.href = stylesheet.href;
            clone.onload = () => resolve();
            clone.onerror = () => resolve();
            printDocument.head.appendChild(clone);
          }),
      );

      for (const style of document.querySelectorAll<HTMLStyleElement>("style")) {
        printDocument.head.appendChild(style.cloneNode(true));
      }

      const printStyle = printDocument.createElement("style");
      printStyle.textContent = `
        @page {
          size: A4 portrait;
          margin: 20mm;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          background: #ffffff !important;
          color: #111827 !important;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 11pt;
          line-height: 1.65;
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }

        .print-document,
        .print-document * {
          box-sizing: border-box;
          color: #111827 !important;
          background-color: #ffffff !important;
          border-color: #e5e7eb !important;
          box-shadow: none !important;
        }

        .print-document {
          width: 100%;
          background: #ffffff !important;
        }

        h1, h2, h3 {
          break-after: avoid-page;
          page-break-after: avoid;
          line-height: 1.25;
        }

        h1 { margin: 0 0 8mm; font-size: 24pt; }
        h2 { margin: 10mm 0 3mm; font-size: 17pt; }
        h3 { margin: 8mm 0 3mm; font-size: 13pt; }
        p { margin: 0 0 4mm; orphans: 3; widows: 3; }
        ul, ol { margin: 0 0 5mm; padding-left: 7mm; }
        li { margin: 1.5mm 0; }

        blockquote {
          margin: 6mm 0;
          padding: 3mm 5mm;
          border-left: 1mm solid #e5e7eb !important;
          background: #ffffff !important;
          font-style: italic;
          break-inside: avoid-page;
          page-break-inside: avoid;
        }

        pre {
          overflow-wrap: anywhere;
          white-space: pre-wrap;
        }

        pre,
        code:not(.katex code):not(.katex-display code) {
          background: #ffffff !important;
          font-family: "SFMono-Regular", Consolas, monospace;
        }

        code:not(pre code):not(.katex code):not(.katex-display code) {
          border: 1px solid #e5e7eb !important;
          border-radius: 2px;
          padding: 0.2mm 1mm;
        }

        table {
          width: 100%;
          margin: 6mm 0;
          border-collapse: collapse;
          break-inside: avoid-page;
          page-break-inside: avoid;
        }

        th,
        td {
          border: 1px solid #e5e7eb !important;
          padding: 2mm 3mm;
          text-align: left;
        }

        thead { display: table-header-group; }
        tr { break-inside: avoid-page; page-break-inside: avoid; }

        .katex-display {
          margin: 7mm 0;
          overflow: visible !important;
          border: 0 !important;
          background: transparent !important;
          padding: 0 !important;
          text-align: center;
          break-inside: avoid-page;
          page-break-inside: avoid;
        }

        .katex,
        .katex * {
          color: #111827 !important;
        }

        a {
          color: #111827 !important;
          text-decoration: underline;
        }

        @media print {
          html,
          body {
            width: 210mm;
            background: #ffffff !important;
          }
        }
      `;
      printDocument.head.appendChild(printStyle);

      const printArticle = printDocument.createElement("article");
      printArticle.className = "print-document";
      printArticle.innerHTML = pdfDocument.innerHTML;
      printDocument.body.appendChild(printArticle);

      await Promise.all(stylesheetLoads);
      await printDocument.fonts.ready;

      printWindow.addEventListener("afterprint", () => printFrame.remove(), { once: true });
      printWindow.focus();
      printWindow.print();
    } finally {
      setIsExportingPdf(false);
      window.setTimeout(() => printFrame.remove(), 60_000);
    }
  }

  return (
    <main className={dark ? "dark" : ""}>
      <div className="app-shell">
        <header className="topbar">
          <div className="brand">
            <div className="brand-mark">
              <Sigma size={18} strokeWidth={2.4} />
            </div>
            <div>
              <div className="brand-name">formula</div>
              <div className="brand-subtitle">Markdown editor</div>
            </div>
          </div>

          <div className="top-actions">
            <div className={`save-state ${saved ? "is-saved" : ""}`}>
              {saved ? <Check size={14} /> : <Sparkles size={14} />}
              <span>{saved ? "Saved" : "Saving"}</span>
            </div>
            <button className="icon-button" onClick={() => setDark(!dark)} aria-label="テーマを切り替える">
              <Moon size={17} />
            </button>
            <button className="download-button" onClick={downloadMarkdown}>
              <Download size={15} />
              <span>Export .md</span>
            </button>
            <button className="pdf-button" onClick={printPdf} disabled={isExportingPdf}>
              {isExportingPdf ? <Sparkles size={15} /> : <FileDown size={15} />}
              <span>{isExportingPdf ? "Preparing print" : "Export PDF"}</span>
            </button>
          </div>
        </header>

        <div className="mobile-tabs">
          <button className={activeTab === "write" ? "active" : ""} onClick={() => setActiveTab("write")}>
            <FileText size={16} /> Write
          </button>
          <button className={activeTab === "preview" ? "active" : ""} onClick={() => setActiveTab("preview")}>
            <Eye size={16} /> Preview
          </button>
        </div>

        <section className="workspace">
          <div className={`editor-pane ${activeTab !== "write" ? "mobile-hidden" : ""}`}>
            <div className="pane-header">
              <div className="pane-title">
                <span className="status-dot" />
                Editor
              </div>
              <span className="shortcut-hint">Markdown + KaTeX</span>
            </div>

            <div className="toolbar">
              {tools.map((tool) => (
                <button key={tool.label} onClick={() => insertSyntax(tool)} title={tool.label} aria-label={tool.label}>
                  <tool.icon size={16} strokeWidth={1.9} />
                </button>
              ))}
            </div>

            <textarea
              ref={textareaRef}
              value={markdown}
              onChange={(event) => setMarkdown(event.target.value)}
              spellCheck={false}
              aria-label="Markdown editor"
            />

            <div className="editor-footer">
              <span>{stats.words} words</span>
              <span>{stats.chars} characters</span>
              <span className="footer-formula">
                <Sigma size={13} /> KaTeX enabled
              </span>
            </div>
          </div>

          <div className={`preview-pane ${activeTab !== "preview" ? "mobile-hidden" : ""}`}>
            <div className="pane-header">
              <div className="pane-title">
                <Eye size={15} />
                Preview
              </div>
              <span className="live-badge">Live</span>
            </div>
            <article className="markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                {markdown}
              </ReactMarkdown>
            </article>
          </div>
        </section>
      </div>

      <div className="pdf-export-host" aria-hidden="true">
        <article ref={pdfDocumentRef} className="pdf-document">
          <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
            {markdown}
          </ReactMarkdown>
        </article>
      </div>
    </main>
  );
}
