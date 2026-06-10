"use client";

import { Command, Download, Eye, FileDown, FileText, Moon, Sigma, Sparkles, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { CommandPalette } from "@/components/command-palette";
import { LatexPreview } from "@/components/latex-preview";
import { ModeSwitcher } from "@/components/mode-switcher";
import { Preview } from "@/components/preview";
import { DEFAULT_LATEX, DEFAULT_MARKDOWN, type EditorMode } from "@/lib/default-content";
import type { CommandSnippet } from "@/lib/snippets";

export function MarkdownEditor() {
  const [mode, setMode] = useState<EditorMode>("markdown");
  const [documents, setDocuments] = useState({ markdown: DEFAULT_MARKDOWN, latex: DEFAULT_LATEX });
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const [dark, setDark] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfDocumentRef = useRef<HTMLDivElement>(null);
  const content = documents[mode];

  const stats = useMemo(() => {
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    return { words, chars: content.length };
  }, [content]);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  function setContent(value: string) {
    setDocuments((current) => ({ ...current, [mode]: value }));
  }

  function insertAtCursor(snippet: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const next = `${content.slice(0, start)}${snippet}${content.slice(end)}`;
    setContent(next);

    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + snippet.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  function insertCommand(command: CommandSnippet) {
    insertAtCursor(command.snippet);
    setPaletteOpen(false);
  }

  function downloadSource() {
    const extension = mode === "markdown" ? "md" : "tex";
    const mimeType = mode === "markdown" ? "text/markdown" : "application/x-tex";
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `document.${extension}`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      const alt = file.name.replace(/\.[^.]+$/, "") || "uploaded image";
      const snippet = mode === "markdown" ? `![${alt}](${reader.result})` : `\\includegraphics{${reader.result}}`;
      insertAtCursor(snippet);
      event.target.value = "";
    };
    reader.readAsDataURL(file);
  }

  async function printPdf() {
    const pdfDocument = pdfDocumentRef.current;
    if (!pdfDocument || isExportingPdf) return;

    setIsExportingPdf(true);
    const printFrame = document.createElement("iframe");
    printFrame.title = "MDTeX PDF print document";
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
      if (!printWindow || !printDocument) throw new Error("印刷用ドキュメントを作成できませんでした。");

      printDocument.open();
      printDocument.write('<!doctype html><html lang="ja"><head><title>MDTeX document</title></head><body></body></html>');
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
        @page { size: A4 portrait; margin: 18mm; }

        html, body, main, .print-root, .print-document {
          overflow: visible !important;
        }

        html, body {
          margin: 0;
          padding: 0;
          background: #ffffff !important;
          color: #111111 !important;
          font-family: "Times New Roman", "Yu Mincho", "Hiragino Mincho ProN", "Hiragino Mincho Pro", "Noto Serif JP", serif;
          font-size: 9.75pt;
          line-height: 1.58;
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }

        .print-document, .print-document * {
          box-sizing: border-box;
          color: #111111 !important;
          border-color: #d1d5db !important;
          box-shadow: none !important;
        }

        .print-document {
          width: 100%;
          background: #ffffff !important;
          font-family: "Times New Roman", "Yu Mincho", "Hiragino Mincho ProN", "Hiragino Mincho Pro", "Noto Serif JP", serif;
          font-size: 9.75pt;
          line-height: 1.58;
        }
        h1, h2, h3, h4, h5, h6 {
          break-after: avoid-page;
          page-break-after: avoid;
          font-family: inherit;
          font-weight: 600;
          line-height: 1.35;
        }
        h1 { margin: 0 0 5mm; font-size: 15pt; }
        h2 { margin: 7mm 0 2mm; font-size: 13pt; }
        h3 { margin: 5mm 0 2mm; font-size: 11.5pt; }
        h4 { margin: 4mm 0 1.5mm; font-size: 10.5pt; }
        h5 { margin: 3.5mm 0 1.5mm; font-size: 10pt; font-weight: 700; }
        h6 { margin: 3mm 0 1.5mm; font-size: 9.5pt; font-weight: 700; }
        p { margin: 0 0 3.5mm; orphans: 3; widows: 3; }
        ul, ol { margin: 0 0 5mm; padding-left: 7mm; }
        li { margin: 1.5mm 0; }
        img { display: block; max-width: 100% !important; max-height: 230mm; margin: 6mm auto; object-fit: contain; }

        blockquote {
          margin: 6mm 0;
          padding: 3mm 5mm;
          border-left: 1mm solid #d1d5db !important;
          background: #ffffff !important;
          font-style: italic;
          break-inside: avoid-page;
          page-break-inside: avoid;
        }

        pre { overflow-wrap: anywhere; white-space: pre-wrap; }
        pre, code:not(.katex code):not(.katex-display code) {
          background: #ffffff !important;
          font-family: "SFMono-Regular", Consolas, monospace;
        }
        code:not(pre code):not(.katex code):not(.katex-display code) {
          border: 1px solid #d1d5db !important;
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
        th, td { border: 1px solid #d1d5db !important; padding: 2mm 3mm; text-align: left; }
        thead { display: table-header-group; }
        tr { break-inside: avoid-page; page-break-inside: avoid; }

        .katex, .katex *, .katex-display, .katex-display > .katex {
          overflow: visible !important;
        }
        .katex {
          font-family: KaTeX_Main, "Times New Roman", serif;
          font-size: 1.06em !important;
          line-height: 1.6 !important;
        }
        .katex-display {
          margin: 1.25em 0 !important;
          padding: 0.7em 0 0.85em !important;
          border: 0 !important;
          background: transparent !important;
          text-align: center;
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }
        .katex-html {
          display: inline !important;
          overflow: visible !important;
        }
        .katex .mfrac, .katex .vlist-t, .katex .vlist-r, .katex .vlist {
          overflow: visible !important;
        }
        .katex .stretchy, .katex .hide-tail {
          overflow: hidden !important;
        }
        .katex .frac-line {
          border-bottom-width: 0.06em !important;
          border-bottom-style: solid !important;
          border-bottom-color: #111111 !important;
        }
        a { color: #111111 !important; text-decoration: underline; }
      `;
      printDocument.head.appendChild(printStyle);

      const printArticle = printDocument.createElement("article");
      printArticle.className = "print-document";
      printArticle.innerHTML = pdfDocument.innerHTML;
      printDocument.body.appendChild(printArticle);

      await Promise.all(stylesheetLoads);
      await printDocument.fonts.ready;
      await Promise.all(
        Array.from(printDocument.images).map((image) =>
          image.complete ? Promise.resolve() : new Promise<void>((resolve) => {
            image.onload = () => resolve();
            image.onerror = () => resolve();
          }),
        ),
      );

      printWindow.addEventListener("afterprint", () => printFrame.remove(), { once: true });
      printWindow.focus();
      printWindow.print();
    } finally {
      setIsExportingPdf(false);
      window.setTimeout(() => printFrame.remove(), 60_000);
    }
  }

  const PreviewComponent = mode === "markdown" ? Preview : LatexPreview;

  return (
    <main className={dark ? "dark" : ""}>
      <div className="app-shell">
        <header className="topbar">
          <div className="brand text-slate-950 dark:text-slate-50">
            <div className="brand-mark"><Sigma size={18} strokeWidth={2.4} /></div>
            <div>
              <div className="brand-name">MDTeX</div>
              <div className="brand-subtitle">Scientific report editor · v2</div>
            </div>
          </div>

          <ModeSwitcher mode={mode} onChange={setMode} />

          <div className="top-actions">
            <button className="command-button" onClick={() => setPaletteOpen(true)} aria-label="Commands">
              <Command size={15} /><span>Commands</span><kbd>⌘K</kbd>
            </button>
            <button className="icon-button" onClick={() => imageInputRef.current?.click()} aria-label="Upload image">
              <Upload size={17} />
            </button>
            <button className="icon-button" onClick={() => setDark(!dark)} aria-label="Toggle theme">
              <Moon size={17} />
            </button>
            <button className="download-button" onClick={downloadSource} aria-label={`Export .${mode === "markdown" ? "md" : "tex"}`}>
              <Download size={15} /><span>Export .{mode === "markdown" ? "md" : "tex"}</span>
            </button>
            <button className="pdf-button" onClick={printPdf} disabled={isExportingPdf} aria-label="Export PDF">
              {isExportingPdf ? <Sparkles size={15} /> : <FileDown size={15} />}
              <span>{isExportingPdf ? "Preparing print" : "Export PDF"}</span>
            </button>
            <input ref={imageInputRef} type="file" accept="image/*" hidden onChange={handleImageUpload} />
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
              <div className="pane-title"><span className="status-dot" />{mode === "markdown" ? "Markdown" : "LaTeX"} source</div>
              <button className="inline-command-button" onClick={() => setPaletteOpen(true)}>
                <Command size={14} /> Insert command
              </button>
            </div>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              spellCheck={false}
              aria-label={`${mode} editor`}
            />
            <div className="editor-footer">
              <span>{stats.words} words</span><span>{stats.chars} characters</span>
              <span className="footer-formula"><Sigma size={13} /> KaTeX enabled</span>
            </div>
          </div>

          <div className={`preview-pane ${activeTab !== "preview" ? "mobile-hidden" : ""}`}>
            <div className="pane-header">
              <div className="pane-title"><Eye size={15} />{mode === "markdown" ? "Markdown" : "LaTeX"} preview</div>
              <span className="live-badge">Live</span>
            </div>
            <PreviewComponent content={content} />
          </div>
        </section>

        <div className="print-note">PDF保存時は、ブラウザの印刷設定でヘッダーとフッターをオフにすると綺麗に出力できます。</div>
      </div>

      <div className="pdf-export-host" aria-hidden="true">
        <div ref={pdfDocumentRef}>
          <PreviewComponent content={content} className="pdf-document" />
        </div>
      </div>

      <CommandPalette mode={mode} open={paletteOpen} onClose={() => setPaletteOpen(false)} onSelect={insertCommand} />
    </main>
  );
}
