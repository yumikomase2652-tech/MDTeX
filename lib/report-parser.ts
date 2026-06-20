import { parsePlotConfig, type PlotConfig } from "@/lib/plot-expression";

export type ReportHeading = { level: number; title: string; number: string; id: string };
export type ReportBlock =
  | { type: "markdown"; content: string }
  | { type: "heading"; heading: ReportHeading }
  | { type: "toc" }
  | { type: "equation"; math: string; number?: number; caption?: string }
  | { type: "figure"; content: string; number?: number; caption: string }
  | { type: "table"; content: string; number?: number; caption: string }
  | { type: "plot"; config?: PlotConfig; error?: string; number?: number; caption: string }
  | { type: "pagebreak" };

export type ReportDocument = { blocks: ReportBlock[]; headings: ReportHeading[] };

const DIRECTIVE = /^::(equation|figure|table|plot)(\*)?(?:\[([^\]]*)\])?\s*$/;
const ENVIRONMENT = /^\\begin\{(equation\*?|align\*?|aligned|gather\*?|gathered|matrix|pmatrix|bmatrix|cases)\}\s*$/;

function slugify(title: string, fallback: string) {
  const slug = title.normalize("NFKC").toLowerCase().replace(/[^\p{Letter}\p{Number}\s-]/gu, "").trim().replace(/\s+/g, "-");
  return slug || fallback;
}

function normalizeEnvironment(name: string, body: string) {
  if (name.startsWith("equation")) return body.trim();
  if (name.startsWith("align")) return `\\begin{aligned}\n${body.trim()}\n\\end{aligned}`;
  if (name.startsWith("gather")) return `\\begin{gathered}\n${body.trim()}\n\\end{gathered}`;
  return `\\begin{${name}}\n${body.trim()}\n\\end{${name}}`;
}

export function parseReport(source: string): ReportDocument {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReportBlock[] = [];
  const headings: ReportHeading[] = [];
  const markdown: string[] = [];
  const headingCounts = [0, 0, 0, 0, 0, 0];
  const slugCounts = new Map<string, number>();
  let equationNumber = 0;
  let figureNumber = 0;
  let tableNumber = 0;

  const flushMarkdown = () => {
    const content = markdown.join("\n").trim();
    if (content) blocks.push({ type: "markdown", content });
    markdown.length = 0;
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (line.startsWith("```")) {
      markdown.push(line);
      while (++index < lines.length) { markdown.push(lines[index]); if (lines[index].startsWith("```")) break; }
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushMarkdown();
      const level = headingMatch[1].length;
      headingCounts[level - 1] += 1;
      for (let depth = level; depth < headingCounts.length; depth += 1) headingCounts[depth] = 0;
      for (let depth = 0; depth < level - 1; depth += 1) if (!headingCounts[depth]) headingCounts[depth] = 1;
      const number = headingCounts.slice(0, level).join(".");
      const title = headingMatch[2].trim();
      const baseSlug = slugify(title, `section-${headings.length + 1}`);
      const duplicate = slugCounts.get(baseSlug) ?? 0;
      slugCounts.set(baseSlug, duplicate + 1);
      const heading: ReportHeading = { level, title, number, id: duplicate ? `${baseSlug}-${duplicate + 1}` : baseSlug };
      headings.push(heading);
      blocks.push({ type: "heading", heading });
      continue;
    }

    if (line.trim().toLowerCase() === "[toc]") { flushMarkdown(); blocks.push({ type: "toc" }); continue; }
    if (line.trim() === "---pagebreak---") { flushMarkdown(); blocks.push({ type: "pagebreak" }); continue; }

    const directive = line.match(DIRECTIVE);
    if (directive) {
      flushMarkdown();
      const [, kind, star, rawCaption] = directive;
      const body: string[] = [];
      while (++index < lines.length && lines[index].trim() !== "::") body.push(lines[index]);
      const content = body.join("\n").trim();
      const numbered = !star;
      const caption = rawCaption?.trim() || (kind === "figure" ? content.match(/^!\[([^\]]*)\]/)?.[1] : "") || "";
      if (kind === "equation") blocks.push({ type: "equation", math: content, ...(numbered ? { number: ++equationNumber } : {}), ...(caption ? { caption } : {}) });
      if (kind === "figure") blocks.push({ type: "figure", content, caption, ...(numbered ? { number: ++figureNumber } : {}) });
      if (kind === "table") blocks.push({ type: "table", content, caption, ...(numbered ? { number: ++tableNumber } : {}) });
      if (kind === "plot") {
        try { blocks.push({ type: "plot", config: parsePlotConfig(content), caption: caption || "Plot", ...(numbered ? { number: ++figureNumber } : {}) }); }
        catch (error) { blocks.push({ type: "plot", error: error instanceof Error ? error.message : "Invalid plot", caption: caption || "Plot", ...(numbered ? { number: ++figureNumber } : {}) }); }
      }
      continue;
    }

    const environment = line.match(ENVIRONMENT);
    if (environment) {
      flushMarkdown();
      const name = environment[1];
      const body: string[] = [];
      const end = `\\end{${name}}`;
      while (++index < lines.length && lines[index].trim() !== end) body.push(lines[index]);
      blocks.push({ type: "equation", math: normalizeEnvironment(name, body.join("\n")) });
      continue;
    }

    const image = line.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*$/);
    if (image && lines[index + 1]?.trim() === "::") {
      flushMarkdown();
      blocks.push({ type: "figure", content: line, caption: image[1], number: ++figureNumber });
      index += 1;
      continue;
    }

    if (line.trim().startsWith("|") && lines.slice(index, index + 30).some((candidate) => /^\|\s*::\s*\|/.test(candidate.trim()))) {
      flushMarkdown();
      const tableLines: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith("|")) {
        if (/^\|\s*::\s*\|/.test(lines[index].trim())) break;
        tableLines.push(lines[index]);
        index += 1;
      }
      const caption = tableLines[0]?.split("|").filter(Boolean).map((cell) => cell.trim()).join(" / ") || "Table";
      blocks.push({ type: "table", content: tableLines.join("\n"), caption, number: ++tableNumber });
      continue;
    }

    if (line.trim() === "::") {
      let start = markdown.length - 1;
      while (start >= 0 && markdown[start].trim()) start -= 1;
      const math = markdown.splice(start + 1).join("\n").trim();
      flushMarkdown();
      if (math) blocks.push({ type: "equation", math, number: ++equationNumber });
      continue;
    }

    markdown.push(line);
  }

  flushMarkdown();
  return { blocks, headings };
}
