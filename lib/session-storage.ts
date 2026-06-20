import { DEFAULT_MARKDOWN } from "@/lib/default-content";

export const SESSION_STORAGE_KEY = "reportmd-session-v1";
const DOCUMENTS_STORAGE_KEY = "reportmd-saved-documents-v3";
const LEGACY_DOCUMENTS_STORAGE_KEY = "mdtex-saved-documents-v2";
const LEGACY_STORAGE_KEY = "mdtex-local-document-v1";

export type EditorSession = { content: string; fileName?: string };

export function readEditorSession(): { session: EditorSession; recovered: boolean } {
  const current = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (current) {
    const parsed = JSON.parse(current) as Partial<EditorSession>;
    if (typeof parsed.content === "string") return { session: { content: parsed.content, ...(parsed.fileName ? { fileName: parsed.fileName } : {}) }, recovered: true };
  }

  for (const key of [DOCUMENTS_STORAGE_KEY, LEGACY_DOCUMENTS_STORAGE_KEY]) {
    const raw = window.localStorage.getItem(key);
    if (!raw) continue;
    const parsed = JSON.parse(raw) as { documents?: Array<Record<string, unknown>>; currentDocumentId?: string };
    const document = parsed.documents?.find((item) => item.id === parsed.currentDocumentId) ?? parsed.documents?.[0];
    const content = document?.content ?? document?.markdownContent ?? document?.latexContent;
    if (typeof content === "string") return { session: { content, ...(typeof document?.importedFileName === "string" ? { fileName: document.importedFileName } : {}) }, recovered: true };
  }

  const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
  if (legacy) {
    const parsed = JSON.parse(legacy) as { documents?: { markdown?: string; latex?: string }; mode?: string };
    const content = parsed.mode === "latex" ? parsed.documents?.latex : parsed.documents?.markdown;
    if (typeof content === "string") return { session: { content }, recovered: true };
  }
  return { session: { content: DEFAULT_MARKDOWN }, recovered: false };
}

export function writeEditorSession(session: EditorSession) {
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}
