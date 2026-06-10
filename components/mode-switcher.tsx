import type { EditorMode } from "@/lib/default-content";

type ModeSwitcherProps = {
  mode: EditorMode;
  onChange: (mode: EditorMode) => void;
};

export function ModeSwitcher({ mode, onChange }: ModeSwitcherProps) {
  return (
    <div className="mode-switcher" aria-label="Editor mode">
      {(["markdown", "latex"] as const).map((option) => (
        <button key={option} className={mode === option ? "active" : ""} onClick={() => onChange(option)}>
          {option === "markdown" ? "Markdown" : "LaTeX"}
        </button>
      ))}
    </div>
  );
}
