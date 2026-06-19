"use client";

import {
  Command,
  Download,
  Eye,
  FileDown,
  Files,
  FileText,
  FolderOpen,
  HardDrive,
  Moon,
  RotateCcw,
  Sigma,
  Sparkles,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CommandPalette } from "@/components/command-palette";
import { LatexOutput } from "@/components/latex-output";
import { Preview } from "@/components/preview";
import { SavedDocuments } from "@/components/saved-documents";
import { DEFAULT_LATEX, DEFAULT_MARKDOWN, type EditorMode } from "@/lib/default-content";
import { compileLatex, getLatexCompileError, latexCompileCapability } from "@/lib/latex-compiler";
import {
  createDocument,
  createId,
  deriveTitle,
  formatLocalDate,
  readDocumentsStore,
  writeDocumentsStore,
  type SavedDocument,
} from "@/lib/document-storage";
import type { CommandSnippet } from "@/lib/snippets";

type Documents = Record<EditorMode, string>;
type SaveStatus = "unsaved" | "saving" | "saved" | "off" | "error";

function isQuotaError(error: unknown) {
  return error instanceof DOMException && (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED");
}

export function MarkdownEditor() {
  const [mode, setMode] = useState<EditorMode>("markdown");
  const [documents, setDocuments] = useState<Documents>({ markdown: DEFAULT_MARKDOWN, latex: DEFAULT_LATEX });
  const [savedDocuments, setSavedDocuments] = useState<SavedDocument[]>([]);
  const [currentDocumentId, setCurrentDocumentId] = useState("");
  const [importedFileName, setImportedFileName] = useState<string | undefined>();
  const [autoSave, setAutoSave] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("unsaved");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const [dark, setDark] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [documentsOpen, setDocumentsOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isCompilingLatex, setIsCompilingLatex] = useState(false);
  const [latexPdfUrl, setLatexPdfUrl] = useState<string | null>(null);
  const [latexLog, setLatexLog] = useState("");
  const [latexCompileError, setLatexCompileError] = useState<string | null>(null);
  const [latexProgressMessage, setLatexProgressMessage] = useState<string | null>(null);
  const [latexOutputView, setLatexOutputView] = useState<"pdf" | "log">("pdf");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfDocumentRef = useRef<HTMLDivElement>(null);
  const skipInitialSaveRef = useRef(true);
  const skipNextAutoSaveRef = useRef(false);
  const savedDocumentsRef = useRef<SavedDocument[]>([]);
  const latexPdfUrlRef = useRef<string | null>(null);
  const latexCompileRunRef = useRef(0);
  const content = documents[mode];

  useEffect(() => {
    try {
      const stored = readDocumentsStore();
      const current = stored.documents.find((document) => document.id === stored.currentDocumentId) ?? stored.documents[0];
      setSavedDocuments(stored.documents);
      setCurrentDocumentId(current.id);
      setDocuments({ markdown: current.markdownContent, latex: current.latexContent });
      setMode(current.mode);
      setAutoSave(stored.autoSave);
      setLastUpdated(current.updatedAt);
      setImportedFileName(current.importedFileName);
      setSaveStatus(stored.autoSave ? "saved" : "off");
      writeDocumentsStore(stored);
    } catch {
      const initial = createDocument();
      setSavedDocuments([initial]);
      setCurrentDocumentId(initial.id);
      setLastUpdated(initial.updatedAt);
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    savedDocumentsRef.current = savedDocuments;
  }, [savedDocuments]);

  useEffect(() => {
    return () => {
      if (latexPdfUrlRef.current) URL.revokeObjectURL(latexPdfUrlRef.current);
    };
  }, []);

  useEffect(() => {
    latexCompileRunRef.current += 1;
    if (latexPdfUrlRef.current) URL.revokeObjectURL(latexPdfUrlRef.current);
    latexPdfUrlRef.current = null;
    setLatexPdfUrl(null);
    setLatexLog("");
    setLatexCompileError(null);
    setLatexProgressMessage(null);
    setLatexOutputView("pdf");
  }, [currentDocumentId]);

  useEffect(() => {
    if (!isHydrated) return;
    if (skipInitialSaveRef.current) {
      skipInitialSaveRef.current = false;
      return;
    }
    if (skipNextAutoSaveRef.current) {
      skipNextAutoSaveRef.current = false;
      return;
    }
    if (!autoSave) {
      setSaveStatus((current) => (current === "error" ? current : "off"));
      return;
    }

    setSaveError(null);
    setSaveStatus("saving");
    const timeout = window.setTimeout(() => {
      const timestamp = new Date().toISOString();
      const updatedDocument: SavedDocument = {
        id: currentDocumentId,
        title: deriveTitle(documents[mode], timestamp),
        mode,
        markdownContent: documents.markdown,
        latexContent: documents.latex,
        createdAt: savedDocumentsRef.current.find((document) => document.id === currentDocumentId)?.createdAt ?? timestamp,
        updatedAt: timestamp,
        ...(importedFileName ? { importedFileName } : {}),
      };
      const nextDocuments = savedDocumentsRef.current.map((document) => document.id === currentDocumentId ? updatedDocument : document);
      try {
        writeDocumentsStore({ version: 2, documents: nextDocuments, currentDocumentId, autoSave });
        setSavedDocuments(nextDocuments);
        setLastUpdated(timestamp);
        setSaveStatus("saved");
      } catch (error) {
        setSaveStatus("error");
        setSaveError(isQuotaError(error) ? "Local storage is full. Please export your file." : "Could not save locally.");
      }
    }, 1_000);

    return () => window.clearTimeout(timeout);
  }, [autoSave, currentDocumentId, documents, importedFileName, isHydrated, mode]);

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
    setSaveError(null);
    setSaveStatus(autoSave ? "unsaved" : "off");
    if (mode === "latex") {
      latexCompileRunRef.current += 1;
      if (latexPdfUrlRef.current) URL.revokeObjectURL(latexPdfUrlRef.current);
      latexPdfUrlRef.current = null;
      setLatexPdfUrl(null);
      setLatexCompileError(null);
      setLatexProgressMessage("Source changed. Compile again to update the PDF.");
    }
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

  function persistDocumentList(nextDocuments: SavedDocument[], nextCurrentDocumentId: string, errorMessage: string) {
    try {
      writeDocumentsStore({ version: 2, documents: nextDocuments, currentDocumentId: nextCurrentDocumentId, autoSave });
      return true;
    } catch (error) {
      setSaveStatus("error");
      setSaveError(isQuotaError(error) ? "Local storage is full. Please export your file." : errorMessage);
      return false;
    }
  }

  function openDocument(document: SavedDocument, documentList = savedDocuments) {
    skipNextAutoSaveRef.current = true;
    setCurrentDocumentId(document.id);
    setMode(document.mode);
    setDocuments({ markdown: document.markdownContent, latex: document.latexContent });
    setImportedFileName(document.importedFileName);
    setLastUpdated(document.updatedAt);
    setSaveError(null);
    setSaveStatus(autoSave ? "saved" : "off");
    setDocumentsOpen(false);
    persistDocumentList(documentList, document.id, "Could not open this saved document.");
  }

  function createNewDocument(documentMode: EditorMode) {
    const document = createDocument({ mode: documentMode });
    const nextDocuments = [...savedDocuments, document];
    if (!persistDocumentList(nextDocuments, document.id, "Could not create a new document.")) return;
    setSavedDocuments(nextDocuments);
    openDocument(document, nextDocuments);
  }

  function duplicateDocument(document: SavedDocument) {
    const timestamp = new Date().toISOString();
    const duplicate: SavedDocument = {
      ...document,
      id: createId(),
      title: `${document.title} copy`,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const nextDocuments = [...savedDocuments, duplicate];
    if (!persistDocumentList(nextDocuments, duplicate.id, "Could not duplicate this document.")) return;
    setSavedDocuments(nextDocuments);
    openDocument(duplicate, nextDocuments);
  }

  function deleteDocument(document: SavedDocument) {
    if (savedDocuments.length === 1) return;
    const nextDocuments = savedDocuments.filter((item) => item.id !== document.id);
    const nextCurrent = document.id === currentDocumentId
      ? [...nextDocuments].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
      : savedDocuments.find((item) => item.id === currentDocumentId) ?? nextDocuments[0];
    if (!persistDocumentList(nextDocuments, nextCurrent.id, "Could not delete this document.")) return;
    setSavedDocuments(nextDocuments);
    if (document.id === currentDocumentId) openDocument(nextCurrent, nextDocuments);
  }

  function toggleAutoSave() {
    const nextAutoSave = !autoSave;
    setAutoSave(nextAutoSave);
    setSaveError(null);
    setSaveStatus(nextAutoSave ? "saving" : "off");

    try {
      writeDocumentsStore({
        version: 2,
        documents: savedDocuments,
        currentDocumentId,
        autoSave: nextAutoSave,
      });
    } catch (error) {
      setSaveStatus("error");
      setSaveError(isQuotaError(error) ? "Local storage is full. Please export your file." : "Could not save Auto Save setting.");
    }
  }

  function resetDemo() {
    if (!window.confirm("Reset this document to the demo content? Your current edits will be replaced.")) return;

    const nextDocuments = mode === "markdown"
      ? { markdown: DEFAULT_MARKDOWN, latex: "" }
      : { markdown: "", latex: DEFAULT_LATEX };
    const timestamp = new Date().toISOString();
    const updatedDocument: SavedDocument = {
      id: currentDocumentId,
      title: deriveTitle(nextDocuments[mode], timestamp),
      mode,
      markdownContent: nextDocuments.markdown,
      latexContent: nextDocuments.latex,
      createdAt: savedDocuments.find((document) => document.id === currentDocumentId)?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };
    const nextSavedDocuments = savedDocuments.map((document) => document.id === currentDocumentId ? updatedDocument : document);
    skipNextAutoSaveRef.current = true;
    latexCompileRunRef.current += 1;
    if (latexPdfUrlRef.current) URL.revokeObjectURL(latexPdfUrlRef.current);
    latexPdfUrlRef.current = null;
    setLatexPdfUrl(null);
    setLatexLog("");
    setLatexCompileError(null);
    setLatexProgressMessage(null);
    setDocuments(nextDocuments);
    setSavedDocuments(nextSavedDocuments);
    setImportedFileName(undefined);
    setLastUpdated(timestamp);
    setSaveError(null);
    setSaveStatus(autoSave ? "saved" : "off");

    try {
      writeDocumentsStore({ version: 2, documents: nextSavedDocuments, currentDocumentId, autoSave });
    } catch (error) {
      setSaveStatus("error");
      setSaveError(isQuotaError(error) ? "Local storage is full. Please export your file." : "Could not reset the local demo.");
    }
  }

  async function handleFileImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const value = await file.text();
      const extension = file.name.split(".").pop()?.toLowerCase();
      if (!extension || !["md", "markdown", "tex", "txt"].includes(extension)) {
        throw new Error("Unsupported file type");
      }
      const nextMode = extension === "tex" ? "latex" : extension === "md" || extension === "markdown" ? "markdown" : mode;
      const importedDocument = createDocument({
        mode: nextMode,
        markdownContent: nextMode === "markdown" ? value : "",
        latexContent: nextMode === "latex" ? value : "",
        importedFileName: file.name,
        blank: true,
      });
      const nextSavedDocuments = [...savedDocuments, importedDocument];
      skipNextAutoSaveRef.current = true;
      setMode(nextMode);
      setDocuments({ markdown: importedDocument.markdownContent, latex: importedDocument.latexContent });
      setSavedDocuments(nextSavedDocuments);
      setCurrentDocumentId(importedDocument.id);
      setImportedFileName(file.name);
      setLastUpdated(importedDocument.updatedAt);
      setSaveError(null);
      setSaveStatus(autoSave ? "saved" : "off");
      writeDocumentsStore({ version: 2, documents: nextSavedDocuments, currentDocumentId: importedDocument.id, autoSave });
    } catch {
      setSaveStatus("error");
      setSaveError("Could not open this file. UTF-8 text files are supported.");
    } finally {
      event.target.value = "";
    }
  }

  function downloadSource() {
    const extension = mode === "markdown" ? "md" : "tex";
    const mimeType = mode === "markdown" ? "text/markdown" : "application/x-tex";
    const baseName = importedFileName?.replace(/\.[^.]+$/, "") || "mdtex-document";
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${baseName}.${extension}`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function compileLatexPdf() {
    if (mode !== "latex" || isCompilingLatex) return;
    const runId = ++latexCompileRunRef.current;
    setIsCompilingLatex(true);
    setLatexCompileError(null);
    setLatexLog("");
    setLatexProgressMessage("Loading SwiftLaTeX engines...");
    setLatexOutputView("pdf");

    try {
      const result = await compileLatex(content, (progress) => {
        if (latexCompileRunRef.current !== runId) return;
        setLatexProgressMessage(progress.message);
        setLatexLog((current) => `${current}${current ? "\n" : ""}${progress.message}`);
      });
      if (latexCompileRunRef.current !== runId) return;

      if (latexPdfUrlRef.current) URL.revokeObjectURL(latexPdfUrlRef.current);
      const url = URL.createObjectURL(result.pdf);
      latexPdfUrlRef.current = url;
      setLatexPdfUrl(url);
      setLatexLog(`${result.log}\n\nCompleted in ${(result.durationMs / 1_000).toFixed(1)} seconds.`);
      setLatexProgressMessage(null);
      setLatexOutputView("pdf");
    } catch (error) {
      if (latexCompileRunRef.current !== runId) return;
      const failure = getLatexCompileError(error);
      setLatexCompileError(failure.message);
      setLatexLog(failure.log);
      setLatexProgressMessage(null);
      setLatexOutputView("log");
    } finally {
      setIsCompilingLatex(false);
    }
  }

  function downloadLatexPdf() {
    if (!latexPdfUrl) return;
    const baseName = importedFileName?.replace(/\.[^.]+$/, "") || "mdtex-document";
    const anchor = document.createElement("a");
    anchor.href = latexPdfUrl;
    anchor.download = `${baseName}.pdf`;
    anchor.click();
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
    if (mode !== "markdown" || !pdfDocument || isExportingPdf) return;

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
        @page { size: A4 portrait; margin: 22mm; }

        html, body, main, .print-root, .print-document {
          overflow: visible !important;
        }

        html, body {
          margin: 0;
          padding: 0;
          background: #ffffff !important;
          color: #111111 !important;
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
        }
        .print-root,
        .print-content,
        .markdown-print-content {
          font-family: "Times New Roman", "Yu Mincho", "Hiragino Mincho ProN", "Hiragino Mincho Pro", "Noto Serif JP", serif;
          font-size: 10.5pt !important;
          line-height: 1.4 !important;
        }
        .markdown-print-content p,
        .markdown-print-content li {
          font-size: 10.5pt !important;
          line-height: 1.4 !important;
        }
        .markdown-print-content h1,
        .markdown-print-content h2,
        .markdown-print-content h3,
        .markdown-print-content h4,
        .markdown-print-content h5,
        .markdown-print-content h6 {
          break-after: avoid-page;
          page-break-after: avoid;
          font-family: inherit;
          font-weight: 600;
          line-height: 1.35;
        }
        .markdown-print-content h1 { margin: 0 0 4mm; font-size: 15pt !important; }
        .markdown-print-content h2 { margin: 6mm 0 1.5mm; font-size: 13pt !important; }
        .markdown-print-content h3 { margin: 4mm 0 1.5mm; font-size: 11.5pt !important; }
        .markdown-print-content h4 { margin: 3mm 0 1mm; font-size: 10.5pt !important; font-weight: 700; }
        .markdown-print-content h5,
        .markdown-print-content h6 { margin: 3mm 0 1mm; font-size: 10.5pt !important; font-weight: 700; }
        p { margin: 0 0 0.45em; orphans: 3; widows: 3; }
        ul, ol { margin: 0 0 3mm; padding-left: 7mm; }
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
      printArticle.className = "print-root print-document";
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

  const statusText = saveError ?? {
    unsaved: "Unsaved",
    saving: "Saving...",
    saved: "Saved locally",
    off: "Auto Save Off",
    error: "Local save error",
  }[saveStatus];
  const formattedLastUpdated = lastUpdated ? formatLocalDate(lastUpdated) : null;

  return (
    <main className={dark ? "dark" : ""}>
      <div className="app-shell">
        <header className="topbar">
          <div className="brand text-slate-950 dark:text-slate-50">
            <div className="brand-mark"><Sigma size={18} strokeWidth={2.4} /></div>
            <div>
              <div className="brand-name">MDTeX</div>
              <div className="brand-subtitle">Scientific report editor · v3</div>
            </div>
          </div>

          <div className="document-type-label"><FileText size={14} />{mode === "markdown" ? "Markdown Editor" : "LaTeX Editor"}</div>

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
            {mode === "markdown" ? (
              <button className="pdf-button" onClick={printPdf} disabled={isExportingPdf} aria-label="Export PDF">
                {isExportingPdf ? <Sparkles size={15} /> : <FileDown size={15} />}
                <span>{isExportingPdf ? "Preparing print" : "Export PDF"}</span>
              </button>
            ) : (
              <>
                {latexPdfUrl && (
                  <button className="download-button" onClick={downloadLatexPdf} aria-label="Download PDF">
                    <Download size={15} /><span>Download PDF</span>
                  </button>
                )}
                <button className="pdf-button compile-button" onClick={compileLatexPdf} disabled={isCompilingLatex} title={latexCompileCapability.message} aria-label="Compile PDF">
                  {isCompilingLatex ? <Sparkles size={15} /> : <FileDown size={15} />}
                  <span>{isCompilingLatex ? "Compiling..." : "Compile PDF"}</span>
                </button>
              </>
            )}
            <input ref={imageInputRef} type="file" accept="image/*" hidden onChange={handleImageUpload} />
          </div>
        </header>

        <div className="document-bar">
          <div className="document-meta" aria-live="polite">
            {importedFileName && <strong title={importedFileName}>{importedFileName}</strong>}
            <span className={`save-status ${saveStatus === "error" ? "error" : ""}`}>
              <HardDrive size={12} />
              {statusText}
            </span>
            {formattedLastUpdated && <time dateTime={lastUpdated ?? undefined}>{formattedLastUpdated}</time>}
            <span className="local-save-note">Stored in this browser only</span>
          </div>
          <div className="document-actions">
            <button className="management-button documents-button" onClick={() => setDocumentsOpen(true)} aria-label="Documents">
              <Files size={14} /><span>Documents</span>
            </button>
            <button className="management-button" onClick={() => fileInputRef.current?.click()} aria-label="Open File">
              <FolderOpen size={14} /><span>Open File</span>
            </button>
            <button
              className={`auto-save-toggle ${autoSave ? "active" : ""}`}
              onClick={toggleAutoSave}
              role="switch"
              aria-checked={autoSave}
              aria-label={`Auto Save ${autoSave ? "ON" : "OFF"}`}
            >
              <span className="toggle-track"><span /></span>
              <span>Auto Save {autoSave ? "ON" : "OFF"}</span>
            </button>
            <button className="management-button" onClick={resetDemo} aria-label="Reset demo">
              <RotateCcw size={14} /><span>Reset demo</span>
            </button>
            <input ref={fileInputRef} type="file" accept=".md,.markdown,.tex,.txt,text/plain,text/markdown,application/x-tex" hidden onChange={handleFileImport} />
          </div>
        </div>

        <div className="mobile-tabs">
          <button className={activeTab === "write" ? "active" : ""} onClick={() => setActiveTab("write")}>
            <FileText size={16} /> {mode === "latex" ? "Source" : "Write"}
          </button>
          <button className={activeTab === "preview" ? "active" : ""} onClick={() => setActiveTab("preview")}>
            <Eye size={16} /> {mode === "latex" ? "PDF / Log" : "Preview"}
          </button>
        </div>

        <section className="workspace">
          <div className={`editor-pane ${activeTab !== "write" ? "mobile-hidden" : ""}`}>
            <div className="pane-header">
              <div className="pane-title"><span className="status-dot" />{mode === "markdown" ? "Markdown" : "LaTeX"} source</div>
            </div>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              spellCheck={false}
              aria-label={`${mode} editor`}
            />
          </div>

          <div className={`preview-pane ${activeTab !== "preview" ? "mobile-hidden" : ""}`}>
            <div className="pane-header">
              <div className="pane-title"><Eye size={15} />{mode === "markdown" ? "Markdown preview" : "LaTeX output"}</div>
              <div className="preview-settings">
                {mode === "latex" ? (
                  <span className="experimental-badge" title={latexCompileCapability.message}>LaTeX compile is experimental</span>
                ) : (
                  <span className="live-badge">Live</span>
                )}
              </div>
            </div>
            {mode === "markdown" ? (
              <Preview content={content} className="preview-content markdown-body" />
            ) : (
              <LatexOutput
                pdfUrl={latexPdfUrl}
                log={latexLog}
                error={latexCompileError}
                progressMessage={latexProgressMessage}
                compiling={isCompilingLatex}
                activeView={latexOutputView}
                onViewChange={setLatexOutputView}
                onCompile={compileLatexPdf}
                onDownload={downloadLatexPdf}
              />
            )}
          </div>
        </section>

        <div className="print-note">
          {mode === "markdown"
            ? "PDF保存時は印刷倍率100%を推奨します。ブラウザのヘッダーとフッターをオフにしてください。"
            : "Experimental: コンパイルはブラウザ内で実行され、必要なTeXファイルのみSwiftLaTeXサービスから取得します。"}
        </div>
      </div>

      {mode === "markdown" && (
        <div className="pdf-export-host" aria-hidden="true">
          <div ref={pdfDocumentRef}>
            <Preview content={content} className="pdf-document print-content markdown-print-content" />
          </div>
        </div>
      )}

      <CommandPalette mode={mode} open={paletteOpen} onClose={() => setPaletteOpen(false)} onSelect={insertCommand} />
      <SavedDocuments
        documents={savedDocuments}
        currentDocumentId={currentDocumentId}
        open={documentsOpen}
        onClose={() => setDocumentsOpen(false)}
        onCreate={createNewDocument}
        onOpen={openDocument}
        onDuplicate={duplicateDocument}
        onDelete={deleteDocument}
      />
    </main>
  );
}
