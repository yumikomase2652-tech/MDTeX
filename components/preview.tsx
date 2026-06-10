import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

type PreviewProps = {
  content: string;
  className?: string;
};

export function Preview({ content, className = "markdown-body" }: PreviewProps) {
  return (
    <article className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        urlTransform={(url) => (url.startsWith("data:image/") ? url : defaultUrlTransform(url))}
        components={{
          // User-provided URLs and Data URLs must render without a Next Image allowlist.
          // eslint-disable-next-line @next/next/no-img-element
          img: ({ alt, ...props }) => <img {...props} alt={alt ?? ""} loading="lazy" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
