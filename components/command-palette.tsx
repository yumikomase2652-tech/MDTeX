"use client";

import { Command, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { commands as allCommands, type CommandSnippet } from "@/lib/snippets";
import { messages, type Locale } from "@/lib/i18n";

type CommandPaletteProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (command: CommandSnippet) => void;
  locale: Locale;
};

export function CommandPalette({ open, onClose, onSelect, locale }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    return allCommands.filter((command) =>
      `${command.label} ${command.description} ${command.keywords}`.toLowerCase().includes(normalized),
    );
  }, [query]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  useEffect(() => {
    setActiveIndex((index) => Math.min(index, Math.max(0, commands.length - 1)));
  }, [commands.length]);

  if (!open) return null;
  const copy = messages[locale];

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
            placeholder={copy.searchCommands}
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
                <strong>{command.label}<em>{command.category}</em></strong>
                <small>{command.description}</small>
              </span>
              <code>{command.snippet.split("\n")[0]}</code>
            </button>
          ))}
          {!commands.length && <div className="palette-empty">{copy.noCommands}</div>}
        </div>
        <div className="palette-footer">{copy.paletteFooter}</div>
      </div>
    </div>
  );
}
