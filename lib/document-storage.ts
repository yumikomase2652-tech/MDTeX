import { DEFAULT_LATEX, DEFAULT_MARKDOWN, type EditorMode } from "@/lib/default-content";

export const DOCUMENTS_STORAGE_KEY = "mdtex-saved-documents-v2";
export const LEGACY_STORAGE_KEY = "mdtex-local-document-v1";

export type SavedDocument = {
  id: string;
  title: string;
  mode: EditorMode;
  markdownContent: string;
  latexContent: string;
  createdAt: string;
  updatedAt: string;
  importedFileName?: string;
};

export type DocumentsStore = {
  version: 2;
  documents: SavedDocument[];
  currentDocumentId: string;
  autoSave: boolean;
};

type LegacyStore = {
  version?: number;
  documents?: { markdown?: string; latex?: string };
  mode?: EditorMode;
  autoSave?: boolean;
  lastUpdated?: string | null;
  importedFileNames?: { markdown?: string | null; latex?: string | null };
};

export function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `mdtex-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function deriveTitle(content: string, updatedAt: string) {
  const firstLine = content.split(/\r?\n/).find((line) => line.trim())?.trim();
  const cleaned = firstLine
    ?.replace(/^#{1,6}\s*/, "")
    .replace(/^\\(?:title|section|subsection)\{(.+)\}$/, "$1")
    .replace(/^[>*-]\s*/, "")
    .trim();
  const fallback = formatLocalDate(updatedAt);
  if (!cleaned) return fallback;
  return cleaned.length > 54 ? `${cleaned.slice(0, 51)}...` : cleaned;
}

export function formatLocalDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (number: number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function createDocument(options?: {
  mode?: EditorMode;
  markdownContent?: string;
  latexContent?: string;
  importedFileName?: string;
  blank?: boolean;
}) {
  const timestamp = new Date().toISOString();
  const mode = options?.mode ?? "markdown";
  const markdownContent = options?.markdownContent ?? (options?.blank ? "" : DEFAULT_MARKDOWN);
  const latexContent = options?.latexContent ?? (options?.blank ? "" : DEFAULT_LATEX);
  const activeContent = mode === "markdown" ? markdownContent : latexContent;
  return {
    id: createId(),
    title: deriveTitle(activeContent, timestamp),
    mode,
    markdownContent,
    latexContent,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...(options?.importedFileName ? { importedFileName: options.importedFileName } : {}),
  } satisfies SavedDocument;
}

export function readDocumentsStore(): DocumentsStore {
  const stored = window.localStorage.getItem(DOCUMENTS_STORAGE_KEY);
  if (stored) {
    const parsed = JSON.parse(stored) as Partial<DocumentsStore>;
    if (
      parsed.version === 2 &&
      Array.isArray(parsed.documents) &&
      typeof parsed.currentDocumentId === "string" &&
      parsed.documents.some((document) => document.id === parsed.currentDocumentId)
    ) {
      return {
        version: 2,
        documents: parsed.documents,
        currentDocumentId: parsed.currentDocumentId,
        autoSave: parsed.autoSave !== false,
      };
    }
  }

  const legacyRaw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
  if (legacyRaw) {
    const legacy = JSON.parse(legacyRaw) as LegacyStore;
    if (typeof legacy.documents?.markdown === "string" && typeof legacy.documents?.latex === "string") {
      const timestamp = legacy.lastUpdated ?? new Date().toISOString();
      const mode = legacy.mode === "latex" ? "latex" : "markdown";
      const activeContent = mode === "markdown" ? legacy.documents.markdown : legacy.documents.latex;
      const importedFileName = legacy.importedFileNames?.[mode] ?? undefined;
      const document: SavedDocument = {
        id: createId(),
        title: deriveTitle(activeContent, timestamp),
        mode,
        markdownContent: legacy.documents.markdown,
        latexContent: legacy.documents.latex,
        createdAt: timestamp,
        updatedAt: timestamp,
        ...(importedFileName ? { importedFileName } : {}),
      };
      return { version: 2, documents: [document], currentDocumentId: document.id, autoSave: legacy.autoSave !== false };
    }
  }

  const document = createDocument();
  return { version: 2, documents: [document], currentDocumentId: document.id, autoSave: true };
}

export function writeDocumentsStore(store: DocumentsStore) {
  window.localStorage.setItem(DOCUMENTS_STORAGE_KEY, JSON.stringify(store));
}
