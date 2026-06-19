export type LatexCompileStage = "loading-engine" | "compiling-xetex" | "building-pdf";

export type LatexCompileProgress = {
  stage: LatexCompileStage;
  message: string;
};

export type LatexCompileResult = {
  pdf: Blob;
  log: string;
  durationMs: number;
};

export type LatexLogError = {
  line?: number;
  message: string;
};

type WorkerResponse = {
  cmd?: string;
  result?: string;
  status?: number;
  log?: string;
  pdf?: ArrayBuffer;
};

type PendingRequest = {
  cmd: string;
  resolve: (response: WorkerResponse) => void;
  reject: (error: Error) => void;
  timeout: number;
};

const ENGINE_TIMEOUT_MS = 180_000;
const SWIFTLATEX_ASSET_ROOT = "/swiftlatex";
const JAPANESE_FONT_FILE = "HaranoAjiMincho-Regular.otf";
const DEFAULT_TEXLIVE_ENDPOINT = "https://texlive.texlyre.org/";
const configuredEndpoint = process.env.NEXT_PUBLIC_SWIFTLATEX_TEXLIVE_ENDPOINT || DEFAULT_TEXLIVE_ENDPOINT;
const TEXLIVE_ENDPOINT = configuredEndpoint.endsWith("/") ? configuredEndpoint : `${configuredEndpoint}/`;

class SwiftLatexWorker {
  private worker: Worker | null = null;
  private readyPromise: Promise<void> | null = null;
  private pending: PendingRequest | null = null;

  constructor(private readonly workerPath: string) {}

  load() {
    if (this.readyPromise) return this.readyPromise;

    this.readyPromise = new Promise<void>((resolve, reject) => {
      const worker = new Worker(this.workerPath);
      this.worker = worker;
      const timeout = window.setTimeout(() => {
        reject(new Error("SwiftLaTeX engine loading timed out."));
        worker.terminate();
        this.worker = null;
        this.readyPromise = null;
      }, ENGINE_TIMEOUT_MS);

      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const response = event.data;
        if (!response.cmd && response.result === "ok") {
          window.clearTimeout(timeout);
          resolve();
          return;
        }
        this.handleResponse(response);
      };

      worker.onerror = (event) => {
        window.clearTimeout(timeout);
        const error = new Error(event.message || "SwiftLaTeX worker crashed.");
        this.pending?.reject(error);
        this.pending = null;
        this.worker = null;
        this.readyPromise = null;
        reject(error);
      };
    });

    return this.readyPromise;
  }

  async writeFile(filename: string, source: string | Uint8Array) {
    const response = await this.request("writefile", { url: filename, src: source });
    if (response.result !== "ok") throw new Error(`Could not write ${filename} to the SwiftLaTeX file system.`);
  }

  setMainFile(filename: string) {
    this.post({ cmd: "setmainfile", url: filename });
  }

  setTexliveEndpoint(endpoint: string) {
    this.post({ cmd: "settexliveurl", url: endpoint });
  }

  compile(command: "compilelatex" | "compilepdf") {
    return this.request("compile", { cmd: command });
  }

  private post(payload: Record<string, unknown>) {
    if (!this.worker) throw new Error("SwiftLaTeX engine is not loaded.");
    this.worker.postMessage(payload);
  }

  private async request(expectedCommand: string, payload: Record<string, unknown>) {
    await this.load();
    if (this.pending) throw new Error("SwiftLaTeX engine is already busy.");

    return new Promise<WorkerResponse>((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        this.pending = null;
        this.worker?.terminate();
        this.worker = null;
        this.readyPromise = null;
        reject(new Error(`SwiftLaTeX ${expectedCommand} timed out.`));
      }, ENGINE_TIMEOUT_MS);

      this.pending = { cmd: expectedCommand, resolve, reject, timeout };
      this.post(payload);
    });
  }

  private handleResponse(response: WorkerResponse) {
    if (!this.pending || response.cmd !== this.pending.cmd) return;
    const pending = this.pending;
    this.pending = null;
    window.clearTimeout(pending.timeout);
    pending.resolve(response);
  }
}

class LatexCompileFailure extends Error {
  constructor(
    message: string,
    readonly log: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "LatexCompileFailure";
  }
}

type EngineBundle = {
  xetex: SwiftLatexWorker;
  dvipdfmx: SwiftLatexWorker;
};

let engineBundlePromise: Promise<EngineBundle> | null = null;

async function loadEngines() {
  if (!engineBundlePromise) {
    engineBundlePromise = (async () => {
      const xetex = new SwiftLatexWorker(`${SWIFTLATEX_ASSET_ROOT}/swiftlatexxetex.js`);
      const dvipdfmx = new SwiftLatexWorker(`${SWIFTLATEX_ASSET_ROOT}/swiftlatexdvipdfm.js`);
      await Promise.all([xetex.load(), dvipdfmx.load()]);
      xetex.setTexliveEndpoint(TEXLIVE_ENDPOINT);
      dvipdfmx.setTexliveEndpoint(TEXLIVE_ENDPOINT);
      const fontResponse = await fetch(`${SWIFTLATEX_ASSET_ROOT}/${JAPANESE_FONT_FILE}`);
      if (!fontResponse.ok) throw new Error("Could not load the bundled Japanese font.");
      const japaneseFont = new Uint8Array(await fontResponse.arrayBuffer());
      await Promise.all([
        xetex.writeFile(JAPANESE_FONT_FILE, japaneseFont),
        dvipdfmx.writeFile(JAPANESE_FONT_FILE, japaneseFont),
      ]);
      return { xetex, dvipdfmx };
    })().catch((error) => {
      engineBundlePromise = null;
      throw error;
    });
  }
  return engineBundlePromise;
}

function requireOutput(response: WorkerResponse, stage: string) {
  if (response.status !== 0 || !response.pdf) {
    throw new LatexCompileFailure(
      `${stage} failed with status ${response.status ?? "unknown"}.`,
      response.log || `${stage} did not return a log.`,
      response.status,
    );
  }
  return new Uint8Array(response.pdf);
}

export async function compileLatex(
  source: string,
  onProgress?: (progress: LatexCompileProgress) => void,
): Promise<LatexCompileResult> {
  if (typeof window === "undefined" || typeof Worker === "undefined") {
    throw new LatexCompileFailure("This browser does not support Web Workers.", "SwiftLaTeX requires Web Workers and WebAssembly.");
  }

  const startedAt = performance.now();
  onProgress?.({ stage: "loading-engine", message: "Loading SwiftLaTeX engines..." });
  const { xetex, dvipdfmx } = await loadEngines();

  onProgress?.({ stage: "compiling-xetex", message: "Compiling LaTeX with XeTeX..." });
  await xetex.writeFile("main.tex", source);
  xetex.setMainFile("main.tex");
  const xetexResult = await xetex.compile("compilelatex");
  const xdv = requireOutput(xetexResult, "XeTeX compilation");

  onProgress?.({ stage: "building-pdf", message: "Building PDF with dvipdfmx..." });
  await dvipdfmx.writeFile("main.xdv", xdv);
  dvipdfmx.setMainFile("main.xdv");
  const pdfResult = await dvipdfmx.compile("compilepdf");
  const pdfBytes = requireOutput(pdfResult, "PDF generation");
  const pdfBuffer = pdfBytes.slice().buffer;

  return {
    pdf: new Blob([pdfBuffer], { type: "application/pdf" }),
    log: `[XeTeX]\n${xetexResult.log || "Compilation succeeded."}\n\n[dvipdfmx]\n${pdfResult.log || "PDF generated."}`,
    durationMs: performance.now() - startedAt,
  };
}

export function getLatexCompileError(error: unknown) {
  if (error instanceof LatexCompileFailure) {
    return { message: error.message, log: error.log, status: error.status };
  }
  const message = error instanceof Error ? error.message : "Unknown LaTeX compilation error.";
  return { message, log: message, status: undefined };
}

export function extractLatexLogErrors(log: string): LatexLogError[] {
  const lines = log.split(/\r?\n/);
  const errors: LatexLogError[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    if (!lines[index].startsWith("!")) continue;
    const message = lines[index].replace(/^!\s*/, "").trim() || "LaTeX error";
    const nearby = lines.slice(index + 1, index + 8).join("\n");
    const lineNumber = nearby.match(/(?:^|\n)l\.(\d+)/)?.[1];
    errors.push({ message, ...(lineNumber ? { line: Number(lineNumber) } : {}) });
  }

  return errors.slice(0, 12);
}

export const latexCompileCapability = {
  status: "experimental" as const,
  available: true as const,
  engine: "SwiftLaTeX XeTeX + dvipdfmx" as const,
  message: "LaTeX compile is experimental. Source stays in your browser; required TeX files are fetched from the configured TeX Live service.",
};
