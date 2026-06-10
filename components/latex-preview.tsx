import { Preview } from "@/components/preview";
import { latexToMarkdown } from "@/lib/latex-preview";

type LatexPreviewProps = {
  content: string;
  className?: string;
};

export function LatexPreview({ content, className }: LatexPreviewProps) {
  return <Preview content={latexToMarkdown(content)} className={className} />;
}
