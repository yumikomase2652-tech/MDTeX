"use client";

import { Copy, FilePlus2, FolderOpen, Trash2, X } from "lucide-react";
import { formatLocalDate, type SavedDocument } from "@/lib/document-storage";

type SavedDocumentsProps = {
  documents: SavedDocument[];
  currentDocumentId: string;
  open: boolean;
  onClose: () => void;
  onCreate: () => void;
  onOpen: (document: SavedDocument) => void;
  onDuplicate: (document: SavedDocument) => void;
  onDelete: (document: SavedDocument) => void;
};

export function SavedDocuments({
  documents,
  currentDocumentId,
  open,
  onClose,
  onCreate,
  onOpen,
  onDuplicate,
  onDelete,
}: SavedDocumentsProps) {
  if (!open) return null;

  return (
    <div className="documents-backdrop" onMouseDown={onClose}>
      <section className="documents-panel" role="dialog" aria-modal="true" aria-label="Saved Documents" onMouseDown={(event) => event.stopPropagation()}>
        <header className="documents-header">
          <div>
            <h2>Saved Documents</h2>
            <p>Stored in this browser only. No cloud sync.</p>
          </div>
          <button onClick={onClose} aria-label="Close Documents"><X size={17} /></button>
        </header>

        <div className="documents-toolbar">
          <button className="new-document-button" onClick={onCreate}><FilePlus2 size={15} />New Document</button>
          <span>{documents.length} document{documents.length === 1 ? "" : "s"}</span>
        </div>

        <div className="documents-list">
          {[...documents].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map((document) => (
            <article className={`document-card ${document.id === currentDocumentId ? "current" : ""}`} key={document.id}>
              <div className="document-card-copy">
                <div className="document-card-title">
                  <strong>{document.title}</strong>
                  {document.id === currentDocumentId && <span>Current</span>}
                </div>
                <small>{formatLocalDate(document.updatedAt)} · {document.mode === "markdown" ? "Markdown" : "LaTeX"}</small>
                {document.importedFileName && <small className="imported-name">{document.importedFileName}</small>}
              </div>
              <div className="document-card-actions">
                <button onClick={() => onOpen(document)}><FolderOpen size={13} />Open</button>
                <button onClick={() => onDuplicate(document)}><Copy size={13} />Duplicate</button>
                <button className="delete-document-button" onClick={() => onDelete(document)} disabled={documents.length === 1}>
                  <Trash2 size={13} />Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
