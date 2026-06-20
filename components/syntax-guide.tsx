"use client";

import { X } from "lucide-react";
import { messages, type Locale } from "@/lib/i18n";
import { getGuideSections } from "@/lib/reportmd-guide";

type SyntaxGuideProps = { open: boolean; onClose: () => void; locale: Locale };

export function SyntaxGuide({ open, onClose, locale }: SyntaxGuideProps) {
  if (!open) return null;
  const copy = messages[locale];
  const sections = getGuideSections(locale);
  return (
    <div className="guide-backdrop" onMouseDown={onClose}>
      <section className="syntax-guide" role="dialog" aria-modal="true" aria-label="ReportMD Syntax Guide" onMouseDown={(event) => event.stopPropagation()}>
        <header><div><h2>ReportMD Syntax Guide</h2><p>{copy.guideDescription}</p></div><button onClick={onClose} aria-label={copy.close}><X size={17} /></button></header>
        <div className="syntax-guide-content">
          {sections.map(({ title, content }) => <article key={title}><h3>{title}</h3><pre>{content}</pre></article>)}
          <p className="syntax-guide-note">Plot expressions: <code>exp sin cos tan sqrt log x ^ + - * /</code></p>
        </div>
      </section>
    </div>
  );
}
