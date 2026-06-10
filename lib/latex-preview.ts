function escapeMarkdownTableCell(value: string) {
  return value.trim().replaceAll("|", "\\|");
}

function convertList(body: string, ordered: boolean) {
  return body
    .split(/\\item\s+/)
    .slice(1)
    .map((item, index) => `${ordered ? `${index + 1}.` : "-"} ${item.trim()}`)
    .join("\n");
}

function convertTabular(body: string) {
  const rows = body
    .replaceAll("\\hline", "")
    .split(/\\\\/)
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row) => row.split("&").map(escapeMarkdownTableCell));

  if (!rows.length) return "";
  const width = Math.max(...rows.map((row) => row.length));
  const normalize = (row: string[]) => [...row, ...Array(Math.max(0, width - row.length)).fill("")];

  return [
    `| ${normalize(rows[0]).join(" | ")} |`,
    `| ${Array(width).fill("---").join(" | ")} |`,
    ...rows.slice(1).map((row) => `| ${normalize(row).join(" | ")} |`),
  ].join("\n");
}

export function latexToMarkdown(source: string) {
  const title = source.match(/\\title\{([^}]*)\}/)?.[1] ?? "Untitled Report";
  const author = source.match(/\\author\{([^}]*)\}/)?.[1] ?? "";
  const date = source.match(/\\date\{([^}]*)\}/)?.[1] ?? "";

  let output = source;
  output = output.replace(/\\title\{[^}]*\}|\\author\{[^}]*\}|\\date\{[^}]*\}/g, "");
  output = output.replace(/\\maketitle/g, `# ${title}\n\n${author ? `**${author}**  \n` : ""}${date}`);
  output = output.replace(/\\section\{([^}]*)\}/g, "## $1");
  output = output.replace(/\\subsection\{([^}]*)\}/g, "### $1");
  output = output.replace(/\\begin\{equation\}([\s\S]*?)\\end\{equation\}/g, (_, body: string) => `\n$$\n${body.trim()}\n$$\n`);
  output = output.replace(
    /\\begin\{align\}([\s\S]*?)\\end\{align\}/g,
    (_, body: string) => `\n$$\n\\begin{aligned}\n${body.trim()}\n\\end{aligned}\n$$\n`,
  );
  output = output.replace(/\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g, (_, body: string) => convertList(body, false));
  output = output.replace(/\\begin\{enumerate\}([\s\S]*?)\\end\{enumerate\}/g, (_, body: string) => convertList(body, true));
  output = output.replace(
    /\\begin\{tabular\}(?:\{[^}]*\})?([\s\S]*?)\\end\{tabular\}/g,
    (_, body: string) => `\n${convertTabular(body)}\n`,
  );
  output = output.replace(/\\includegraphics(?:\[[^\]]*\])?\{([^}]*)\}/g, "![$1]($1)");
  output = output.replace(/\\textbf\{([^}]*)\}/g, "**$1**");
  output = output.replace(/\\emph\{([^}]*)\}/g, "*$1*");

  return output.trim();
}
