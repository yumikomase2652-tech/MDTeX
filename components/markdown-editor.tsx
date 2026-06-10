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

const SAFE_TEXT_COLOR = "#111827";
const SAFE_BACKGROUND_COLOR = "#ffffff";
const SAFE_BORDER_COLOR = "#e5e7eb";

function applySafePdfColors(pdfDocument: HTMLElement) {
  const elements = [pdfDocument, ...Array.from(pdfDocument.querySelectorAll<HTMLElement>("*"))];

  for (const element of elements) {
    // Reading computed styles first ensures every color-bearing node is normalized
    // before html2canvas parses the PDF-only DOM.
    window.getComputedStyle(element);

    element.style.color = SAFE_TEXT_COLOR;
    element.style.backgroundColor = SAFE_BACKGROUND_COLOR;
    element.style.borderColor = SAFE_BORDER_COLOR;
    element.style.outlineColor = SAFE_BORDER_COLOR;
    element.style.textDecorationColor = SAFE_TEXT_COLOR;
    element.style.caretColor = SAFE_TEXT_COLOR;

    if (element instanceof SVGElement) {
      element.style.fill = SAFE_TEXT_COLOR;
      element.style.stroke = SAFE_TEXT_COLOR;
    }
  }

  pdfDocument.style.backgroundColor = SAFE_BACKGROUND_COLOR;
}

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

  async function downloadPdf() {
    const pdfDocument = pdfDocumentRef.current;
    if (!pdfDocument || isExportingPdf) return;

    setIsExportingPdf(true);

    try {
      await document.fonts.ready;
      applySafePdfColors(pdfDocument);
      const { default: html2pdf } = await import("html2pdf.js");

      await html2pdf()
        .set({
          filename: "document.pdf",
          margin: [14, 14, 16, 14],
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: {
            backgroundColor: "#ffffff",
            scale: 2,
            useCORS: true,
          },
          jsPDF: {
            unit: "mm",
            format: "a4",
            orientation: "portrait",
          },
        })
        .from(pdfDocument)
        .save();
    } finally {
      setIsExportingPdf(false);
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
            <button className="pdf-button" onClick={downloadPdf} disabled={isExportingPdf}>
              {isExportingPdf ? <Sparkles size={15} /> : <FileDown size={15} />}
              <span>{isExportingPdf ? "Creating PDF" : "Export PDF"}</span>
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
