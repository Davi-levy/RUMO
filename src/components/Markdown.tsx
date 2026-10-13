import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { isValidElement, type ReactNode } from "react";
import { CodeBlock } from "./CodeBlock";

export function Markdown({ children }: { children: string }) {
  return (
    <article className="prose prose-invert prose-sm max-w-none prose-headings:font-display prose-headings:tracking-tight prose-table:border-collapse prose-th:bg-muted prose-th:text-foreground prose-th:font-mono prose-th:uppercase prose-th:text-xs prose-th:tracking-wider prose-th:border prose-th:border-border prose-td:border prose-td:border-border prose-ul:list-disc prose-ol:list-decimal prose-li:marker:text-muted-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre({ children }) {
            if (!isValidElement<{ className?: string; children?: ReactNode }>(children)) return <pre>{children}</pre>;
            const language = /language-([^\s]+)/.exec(children.props.className ?? "")?.[1];
            return <CodeBlock code={String(children.props.children ?? "").replace(/\n$/, "")} language={language} />;
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </article>
  );
}

