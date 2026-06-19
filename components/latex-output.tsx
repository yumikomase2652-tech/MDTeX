import { AlertTriangle, Download, FileText, Terminal } from "lucide-react";
import { extractLatexLogErrors } from "@/lib/latex-compiler";

type LatexOutputProps = {
  pdfUrl: string | null;
  log: string;
  error: string | null;
  progressMessage: string | null;
  compiling: boolean;
  activeView: "pdf" | "log";
  onViewChange: (view: "pdf" | "log") => void;
  onCompile: () => void;
  onDownload: () => void;
};

export function LatexOutput({
  pdfUrl,
  log,
  error,
  progressMessage,
  compiling,
  activeView,
  onViewChange,
  onCompile,
  onDownload,
}: LatexOutputProps) {
  const logErrors = extractLatexLogErrors(log);

  return (
    <div className="latex-output">
      <div className="latex-output-tabs" role="tablist" aria-label="LaTeX output">
        <button className={activeView === "pdf" ? "active" : ""} onClick={() => onViewChange("pdf")} role="tab" aria-selected={activeView === "pdf"}>
          <FileText size={14} /> PDF Preview
        </button>
        <button className={activeView === "log" ? "active" : ""} onClick={() => onViewChange("log")} role="tab" aria-selected={activeView === "log"}>
          <Terminal size={14} /> Log
        </button>
        {pdfUrl && <button className="latex-download-inline" onClick={onDownload}><Download size={14} /> Download PDF</button>}
      </div>

      {activeView === "pdf" ? (
        <div className="latex-pdf-view">
          {pdfUrl ? (
            <iframe src={pdfUrl} title="Compiled LaTeX PDF preview" />
          ) : (
            <div className="latex-output-empty">
              <FileText size={30} />
              <strong>{compiling ? "Compiling LaTeX..." : "No compiled PDF yet"}</strong>
              <p>{progressMessage ?? "Compile PDFを押すとXeTeXがブラウザ内で処理します。TeX Liveサービスへの接続が必要です。"}</p>
              {!compiling && <button onClick={onCompile}>Compile PDF</button>}
            </div>
          )}
        </div>
      ) : (
        <div className="latex-log-view">
          {error && <div className="latex-error-heading"><AlertTriangle size={16} /><strong>{error}</strong></div>}
          {logErrors.length > 0 && (
            <div className="latex-error-list">
              {logErrors.map((item, index) => (
                <div key={`${item.line ?? "unknown"}-${index}`}>
                  <span>{item.line ? `Line ${item.line}` : "LaTeX"}</span>
                  <p>{item.message}</p>
                </div>
              ))}
            </div>
          )}
          <pre>{log || progressMessage || "Compile log will appear here."}</pre>
        </div>
      )}
    </div>
  );
}
