export type PlotSeries = { label: string; expression: string };
export type PlotConfig = {
  title: string;
  xlabel: string;
  ylabel: string;
  xmin: number;
  xmax: number;
  series: PlotSeries[];
};

type Token = { type: "number" | "name" | "operator" | "paren"; value: string };

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  while (index < source.length) {
    const rest = source.slice(index);
    const whitespace = rest.match(/^\s+/);
    if (whitespace) { index += whitespace[0].length; continue; }
    const number = rest.match(/^(?:\d+(?:\.\d*)?|\.\d+)/);
    if (number) { tokens.push({ type: "number", value: number[0] }); index += number[0].length; continue; }
    const name = rest.match(/^[A-Za-z]+/);
    if (name) { tokens.push({ type: "name", value: name[0] }); index += name[0].length; continue; }
    const character = source[index];
    if ("+-*/^".includes(character)) tokens.push({ type: "operator", value: character });
    else if ("()".includes(character)) tokens.push({ type: "paren", value: character });
    else throw new Error(`Unsupported character: ${character}`);
    index += 1;
  }
  return tokens;
}

export function compilePlotExpression(source: string) {
  const tokens = tokenize(source);
  let position = 0;
  const current = () => tokens[position];
  const consume = () => tokens[position++];

  function primary(x: number): number {
    const token = consume();
    if (!token) throw new Error("Unexpected end of expression");
    if (token.type === "number") return Number(token.value);
    if (token.type === "name") {
      if (token.value === "x") return x;
      const functions: Record<string, (value: number) => number> = {
        exp: Math.exp, sin: Math.sin, cos: Math.cos, tan: Math.tan, sqrt: Math.sqrt, log: Math.log,
      };
      const fn = functions[token.value];
      if (!fn || current()?.value !== "(") throw new Error(`Unsupported function: ${token.value}`);
      consume();
      const value = expression(x);
      if (consume()?.value !== ")") throw new Error("Missing closing parenthesis");
      return fn(value);
    }
    if (token.value === "(") {
      const value = expression(x);
      if (consume()?.value !== ")") throw new Error("Missing closing parenthesis");
      return value;
    }
    throw new Error(`Unexpected token: ${token.value}`);
  }

  function power(x: number): number {
    const left = primary(x);
    if (current()?.value === "^") { consume(); return left ** unary(x); }
    return left;
  }

  function unary(x: number): number {
    if (current()?.value === "+") { consume(); return unary(x); }
    if (current()?.value === "-") { consume(); return -unary(x); }
    return power(x);
  }

  function term(x: number): number {
    let value = unary(x);
    while (current()?.value === "*" || current()?.value === "/") {
      const operator = consume().value;
      const right = unary(x);
      value = operator === "*" ? value * right : value / right;
    }
    return value;
  }

  function expression(x: number): number {
    let value = term(x);
    while (current()?.value === "+" || current()?.value === "-") {
      const operator = consume().value;
      const right = term(x);
      value = operator === "+" ? value + right : value - right;
    }
    return value;
  }

  return (x: number) => {
    position = 0;
    const value = expression(x);
    if (position !== tokens.length) throw new Error(`Unexpected token: ${current()?.value}`);
    return value;
  };
}

export function parsePlotConfig(source: string): PlotConfig {
  const lines = source.split(/\r?\n/);
  const value = (key: string) => lines.find((line) => line.trim().startsWith(`${key}:`))?.split(":").slice(1).join(":").trim() ?? "";
  const series: PlotSeries[] = [];
  let currentSeries: Partial<PlotSeries> | null = null;
  for (const line of lines) {
    const label = line.match(/^\s*-\s*label:\s*(.+)$/);
    if (label) {
      if (currentSeries?.label && currentSeries.expression) series.push(currentSeries as PlotSeries);
      currentSeries = { label: label[1].trim() };
      continue;
    }
    const expression = line.match(/^\s*expr:\s*(.+)$/);
    if (expression && currentSeries) currentSeries.expression = expression[1].trim();
  }
  if (currentSeries?.label && currentSeries.expression) series.push(currentSeries as PlotSeries);
  const xmin = Number(value("xmin") || -5);
  const xmax = Number(value("xmax") || 5);
  if (!Number.isFinite(xmin) || !Number.isFinite(xmax) || xmin >= xmax) throw new Error("plot requires xmin < xmax");
  if (!series.length) throw new Error("plot requires at least one function");
  return { title: value("title"), xlabel: value("xlabel") || "x", ylabel: value("ylabel") || "y", xmin, xmax, series };
}
