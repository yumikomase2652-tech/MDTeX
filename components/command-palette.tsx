"use client";

import { Command, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { EditorMode } from "@/lib/default-content";
import { getCommands, type CommandSnippet } from "@/lib/snippets";

type CommandPaletteProps = {
  mode: EditorMode;
  open: boolean;
  onClose: () => void;
  onSelect: (command: CommandSnippet) => void;
};

export function CommandPalette({ mode, open, onClose, onSelect }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    return getCommands(mode).filter((command) =>
      `${command.label} ${command.description} ${command.keywords}`.toLowerCase().includes(normalized),
    );
  }, [mode, query]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open, mode]);

  useEffect(() => {
    setActiveIndex((index) => Math.min(index, Math.max(0, commands.length - 1)));
  }, [commands.length]);

  if (!open) return null;

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") onClose();
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(commands.length - 1, index + 1));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(0, index - 1));
    }
    if (event.key === "Enter" && commands[activeIndex]) {
      event.preventDefault();
      onSelect(commands[activeIndex]);
    }
  }

  return (
    <div className="palette-backdrop" onMouseDown={onClose}>
      <div className="command-palette" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <div className="palette-search">
          <Search size={17} />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Search ${mode} commands…`}
          />
          <button onClick={onClose} aria-label="Close command palette">
            <X size={16} />
          </button>
        </div>
        <div className="palette-results">
          {commands.map((command, index) => (
            <button
              key={command.id}
              className={index === activeIndex ? "active" : ""}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => onSelect(command)}
            >
              <span className="command-icon">
                <Command size={15} />
              </span>
              <span>
                <strong>{command.label}</strong>
                <small>{command.description}</small>
              </span>
              <code>{command.snippet.split("\n")[0]}</code>
            </button>
          ))}
          {!commands.length && <div className="palette-empty">No matching commands</div>}
        </div>
        <div className="palette-footer">↑↓ Navigate · Enter Insert · Esc Close</div>
      </div>
    </div>
  );
}
