"use client";

import { Check, Command, Download, Eye, FileDown, FileText, Moon, Sigma, Sparkles, Upload } from "lucide-react";
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
  const [saved, setSaved] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfDocumentRef = useRef<HTMLDivElement>(null);
  const content = documents[mode];

  const stats = useMemo(() => {
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    return { words, chars: content.length };
  }, [content]);

  useEffect(() => {
    setSaved(false);
    const timer = window.setTimeout(() => setSaved(true), 700);
    return () => window.clearTimeout(timer);
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

        html, body, main, .print-root, .print-document, .print-document * {
          overflow: visible !important;
        }

        html, body {
          margin: 0;
          padding: 0;
          background: #ffffff !important;
          color: #111111 !important;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 11pt;
          line-height: 1.68;
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }

        .print-document, .print-document * {
          box-sizing: border-box;
          color: #111111 !important;
          border-color: #d1d5db !important;
          box-shadow: none !important;
        }

        .print-document { width: 100%; background: #ffffff !important; }
        h1, h2, h3 { break-after: avoid-page; page-break-after: avoid; line-height: 1.3; }
        h1 { margin: 0 0 8mm; font-size: 24pt; }
        h2 { margin: 10mm 0 3mm; font-size: 17pt; }
        h3 { margin: 8mm 0 3mm; font-size: 13pt; }
        p { margin: 0 0 4mm; orphans: 3; widows: 3; }
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

        .katex, .katex *, .katex-display, .katex-display * {
          overflow: visible !important;
        }
        .katex { font-size: 1.08em !important; line-height: 1.8 !important; }
        .katex-display {
          margin: 1.4em 0 !important;
          padding: 0.9em 0 1.1em !important;
          border: 0 !important;
          background: transparent !important;
          text-align: center;
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }
        .katex-html {
          display: inline-block !important;
          overflow: visible !important;
          padding: 0.1em 0 0.22em;
        }
        .katex .mfrac, .katex .vlist-t, .katex .vlist-r, .katex .vlist {
          overflow: visible !important;
        }
        .katex .frac-line {
          border-bottom-width: 0.07em !important;
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
          <div className="brand">
            <div className="brand-mark"><Sigma size={18} strokeWidth={2.4} /></div>
            <div>
              <div className="brand-name">MDTeX</div>
              <div className="brand-subtitle">Scientific report editor · v0.2</div>
            </div>
          </div>

          <ModeSwitcher mode={mode} onChange={setMode} />

          <div className="top-actions">
            <div className={`save-state ${saved ? "is-saved" : ""}`}>
              {saved ? <Check size={14} /> : <Sparkles size={14} />}
              <span>{saved ? "Saved" : "Saving"}</span>
            </div>
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
