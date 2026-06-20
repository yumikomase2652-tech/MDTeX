"use client";

import { Bot, Check, CircleHelp, Command, Copy, Eye, FileDown, FilePlus2, FileText, FolderOpen, Languages, Moon, Save, Settings, Sparkles, Upload } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { CommandPalette } from "@/components/command-palette";
import { Preview } from "@/components/preview";
import { SyntaxGuide } from "@/components/syntax-guide";
import { DEFAULT_MARKDOWN } from "@/lib/default-content";
import { detectLocale, messages, type Locale } from "@/lib/i18n";
import { getAiPrompt, getSyntaxGuideText } from "@/lib/reportmd-guide";
import { readEditorSession, writeEditorSession } from "@/lib/session-storage";
import type { CommandSnippet } from "@/lib/snippets";

const LANGUAGE_STORAGE_KEY = "reportmd-language-v1";

export function MarkdownEditor() {
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState<string>();
  const [locale, setLocale] = useState<Locale>("en");
  const [isHydrated, setIsHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const [dark, setDark] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notice, setNotice] = useState<string>();
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfDocumentRef = useRef<HTMLDivElement>(null);
  const copy = messages[locale];

  useEffect(() => {
    const storedLocale = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    const initialLocale: Locale = storedLocale === "ja" || storedLocale === "en" ? storedLocale : detectLocale();
    setLocale(initialLocale);
    document.documentElement.lang = initialLocale;
    try {
      const { session, recovered } = readEditorSession();
      setContent(session.content);
      setFileName(session.fileName);
      if (recovered) setNotice(messages[initialLocale].recovered);
    } catch {
      setContent(DEFAULT_MARKDOWN);
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(undefined), 3_000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    if (!isHydrated) return;
    const timeout = window.setTimeout(() => {
      try { writeEditorSession({ content, ...(fileName ? { fileName } : {}) }); } catch { /* Session recovery is best-effort. */ }
    }, 600);
    return () => window.clearTimeout(timeout);
  }, [content, fileName, isHydrated]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        downloadSource();
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  });

  function insertAtCursor(snippet: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    setContent(`${content.slice(0, start)}${snippet}${content.slice(end)}`);
    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + snippet.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  function insertCommand(command: CommandSnippet) { insertAtCursor(command.snippet); setPaletteOpen(false); }

  function confirmReplace() {
    return window.confirm(copy.destructiveConfirm);
  }

  function createNew() {
    if (!confirmReplace()) return;
    setContent("");
    setFileName(undefined);
    setActiveTab("write");
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  function requestOpen() {
    if (!confirmReplace()) return;
    fileInputRef.current?.click();
  }

  async function handleFileImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const extension = file.name.split(".").pop()?.toLowerCase();
      if (!extension || !["md", "markdown", "txt"].includes(extension)) throw new Error("Unsupported file type");
      setContent(await file.text());
      setFileName(file.name);
      setActiveTab("write");
    } catch {
      window.alert(locale === "ja" ? "UTF-8のMarkdownまたはテキストファイルを開けませんでした。" : "Could not open this UTF-8 Markdown or text file.");
    } finally {
      event.target.value = "";
    }
  }

  function downloadSource() {
    const baseName = fileName?.replace(/\.[^.]+$/, "") || "report";
    const url = URL.createObjectURL(new Blob([content], { type: "text/markdown;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${baseName}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") insertAtCursor(`![${file.name.replace(/\.[^.]+$/, "") || "image"}](${reader.result})`);
      event.target.value = "";
    };
    reader.readAsDataURL(file);
  }

  function copyText(value: string) {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    if (!copied && navigator.clipboard) void navigator.clipboard.writeText(value);
    setHelpOpen(false);
    setNotice(copy.copied);
  }

  function changeLanguage(nextLocale: Locale) {
    setLocale(nextLocale);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLocale);
    document.documentElement.lang = nextLocale;
    setSettingsOpen(false);
  }

  async function printPdf() {
    const source = pdfDocumentRef.current;
    if (!source || isExportingPdf) return;
    setIsExportingPdf(true);
    const frame = document.createElement("iframe");
    frame.title = "ReportMD PDF print document";
    Object.assign(frame.style, { position: "fixed", right: "100%", bottom: "100%", width: "1px", height: "1px", border: "0" });
    document.body.appendChild(frame);
    try {
      const printWindow = frame.contentWindow;
      const printDocument = frame.contentDocument;
      if (!printWindow || !printDocument) throw new Error("Could not create print document.");
      printDocument.open();
      printDocument.write(`<!doctype html><html lang="${locale}"><head><title>ReportMD document</title></head><body></body></html>`);
      printDocument.close();
      const loads = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')).map((stylesheet) => new Promise<void>((resolve) => {
        const clone = stylesheet.cloneNode(true) as HTMLLinkElement;
        clone.href = stylesheet.href;
        clone.onload = clone.onerror = () => resolve();
        printDocument.head.appendChild(clone);
      }));
      for (const existingStyle of document.querySelectorAll<HTMLStyleElement>("style")) printDocument.head.appendChild(existingStyle.cloneNode(true));
      const style = printDocument.createElement("style");
      style.textContent = `
        @page { size: A4 portrait; margin: 22mm; }
        html, body, .print-root, .print-document { overflow: visible !important; }
        html, body { margin: 0; padding: 0; background: #fff !important; color: #111 !important; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        .print-document, .print-document * { box-sizing: border-box; color: #111 !important; border-color: #d1d5db !important; box-shadow: none !important; }
        .print-root, .print-content, .markdown-print-content { width: 100%; overflow: visible !important; background: #fff !important; font-family: "Times New Roman", "Yu Mincho", "Hiragino Mincho ProN", "Hiragino Mincho Pro", "Noto Serif JP", serif; font-size: 10.5pt !important; line-height: 1.4 !important; }
        .markdown-print-content p, .markdown-print-content li { font-size: 10.5pt !important; line-height: 1.4 !important; }
        .markdown-print-content h1 { font-size: 15pt !important; } .markdown-print-content h2 { font-size: 13pt !important; } .markdown-print-content h3 { font-size: 11.5pt !important; } .markdown-print-content h4, .markdown-print-content h5, .markdown-print-content h6 { font-size: 10.5pt !important; font-weight: 700; }
        p { margin: 0 0 .45em; orphans: 3; widows: 3; } img { max-width: 100% !important; max-height: 220mm; object-fit: contain; }
        table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #d1d5db !important; padding: 2mm 3mm; }
        .katex, .katex *, .katex-display, .report-equation { overflow: visible !important; } .katex { line-height: 1.6 !important; } .katex-display { margin: 1.1em 0 !important; padding: .65em 0 !important; border: 0 !important; background: transparent !important; } .katex-html { display: inline !important; } .katex .frac-line { border-bottom-width: .06em !important; }
        .report-pagebreak { break-before: page !important; page-break-before: always !important; }
        .report-figure, .report-table, .report-equation, .report-toc { break-inside: avoid; page-break-inside: avoid; }
        .print-page-number { position: fixed; right: 0; bottom: -15mm; left: 0; text-align: center; font: 9pt "Times New Roman", serif; }
        .print-page-number::after { content: counter(page); }
      `;
      printDocument.head.appendChild(style);
      const article = printDocument.createElement("article");
      article.className = "print-root print-document";
      article.innerHTML = source.innerHTML;
      const pageNumber = printDocument.createElement("div");
      pageNumber.className = "print-page-number";
      printDocument.body.append(article, pageNumber);
      await Promise.all(loads);
      await printDocument.fonts.ready;
      await Promise.all(Array.from(printDocument.images).map((image) => image.complete ? Promise.resolve() : new Promise<void>((resolve) => { image.onload = image.onerror = () => resolve(); })));
      printWindow.addEventListener("afterprint", () => frame.remove(), { once: true });
      printWindow.focus();
      printWindow.print();
    } finally {
      setIsExportingPdf(false);
      window.setTimeout(() => frame.remove(), 60_000);
    }
  }

  return (
    <main className={dark ? "dark" : ""}>
      <div className="app-shell">
        <header className="topbar">
          <div className="brand text-slate-950 dark:text-slate-50"><div className="brand-mark"><Image src="/icon-192.png" alt="" width={34} height={34} priority /></div><div><div className="brand-name">ReportMD</div><div className="brand-subtitle">Markdown LaTeX-style reports</div></div></div>
          <div className="document-type-label"><FileText size={14} />{copy.markdownReport}</div>
          <div className="top-actions">
            <button className="command-button" onClick={() => setPaletteOpen(true)} aria-label={copy.commands}><Command size={15} /><span>{copy.commands}</span><kbd>⌘K</kbd></button>
            <div className="toolbar-menu-wrap">
              <button className="icon-button" onClick={() => { setHelpOpen(!helpOpen); setSettingsOpen(false); }} aria-label={copy.help}><CircleHelp size={17} /></button>
              {helpOpen && <div className="toolbar-menu help-menu"><button onClick={() => { setGuideOpen(true); setHelpOpen(false); }}><CircleHelp size={14} />{copy.syntaxGuide}</button><button onClick={() => copyText(getSyntaxGuideText(locale))}><Copy size={14} />{copy.copySyntaxGuide}</button><button onClick={() => copyText(getAiPrompt(locale))}><Bot size={14} />{copy.generateAi}</button></div>}
            </div>
            <button className="icon-button image-upload-button" onClick={() => imageInputRef.current?.click()} aria-label={copy.uploadImage}><Upload size={17} /></button>
            <button className="icon-button" onClick={() => setDark(!dark)} aria-label={copy.toggleTheme}><Moon size={17} /></button>
            <div className="toolbar-menu-wrap">
              <button className="icon-button" onClick={() => { setSettingsOpen(!settingsOpen); setHelpOpen(false); }} aria-label={copy.settings}><Settings size={17} /></button>
              {settingsOpen && <div className="toolbar-menu settings-menu"><div className="menu-heading"><Languages size={14} />{copy.language}</div><button onClick={() => changeLanguage("ja")}>{locale === "ja" && <Check size={13} />}{copy.japanese}</button><button onClick={() => changeLanguage("en")}>{locale === "en" && <Check size={13} />}{copy.english}</button></div>}
            </div>
            <button className="pdf-button" onClick={printPdf} disabled={isExportingPdf} aria-label={copy.exportPdf}>{isExportingPdf ? <Sparkles size={15} /> : <FileDown size={15} />}<span>{isExportingPdf ? copy.preparingPrint : copy.exportPdf}</span></button>
            <input ref={imageInputRef} type="file" accept="image/*" hidden onChange={handleImageUpload} />
          </div>
        </header>
        <div className="file-toolbar">
          <button className="file-action" onClick={createNew}><FilePlus2 size={15} />{copy.new}</button>
          <button className="file-action" onClick={requestOpen}><FolderOpen size={15} />{copy.open}</button>
          <button className="file-action primary" onClick={downloadSource}><Save size={15} />{copy.save}</button>
          <input ref={fileInputRef} type="file" accept=".md,.markdown,.txt,text/plain,text/markdown" hidden onChange={handleFileImport} />
        </div>
        <div className="mobile-tabs"><button className={activeTab === "write" ? "active" : ""} onClick={() => setActiveTab("write")}><FileText size={16} /> {copy.write}</button><button className={activeTab === "preview" ? "active" : ""} onClick={() => setActiveTab("preview")}><Eye size={16} /> {copy.previewTab}</button></div>
        <section className="workspace">
          <div className={`editor-pane ${activeTab !== "write" ? "mobile-hidden" : ""}`}><div className="pane-header"><div className="pane-title"><span className="status-dot" />{copy.source}</div></div><textarea ref={textareaRef} value={content} onChange={(event) => setContent(event.target.value)} spellCheck={false} aria-label="Markdown editor" /></div>
          <div className={`preview-pane ${activeTab !== "preview" ? "mobile-hidden" : ""}`}><div className="pane-header"><div className="pane-title"><Eye size={15} />{copy.preview}</div><span className="live-badge">{copy.live}</span></div><Preview content={content} locale={locale} /></div>
        </section>
        <div className="print-note">{copy.printNote}</div>
      </div>
      <div className="pdf-export-host" aria-hidden="true"><div ref={pdfDocumentRef}><Preview content={content} locale={locale} className="pdf-document print-content markdown-print-content" /></div></div>
      {notice && <div className="app-toast" role="status">{notice}</div>}
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} onSelect={insertCommand} locale={locale} />
      <SyntaxGuide open={guideOpen} onClose={() => setGuideOpen(false)} locale={locale} />
    </main>
  );
}
