export type LatexCompileCapability = {
  status: "coming-soon";
  available: false;
  engine: null;
  message: string;
};

// This boundary is intentionally separate so a WASM TeX engine can replace it
// without coupling compiler assets to the editor or simplified preview.
export const latexCompileCapability: LatexCompileCapability = {
  status: "coming-soon",
  available: false,
  engine: null,
  message: "このプレビューは簡易表示です。documentclassの文字サイズなどはCompile PDFで反映されます。Compile PDFは準備中です。",
};
