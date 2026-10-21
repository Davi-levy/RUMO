import { Plus } from "lucide-react";
import { publicFaqs } from "@/lib/public-content";

export function PublicFaq({ compact = false }: { compact?: boolean }) {
  const items = compact
    ? publicFaqs.filter((f) =>
        [
          "comecar",
          "codigo-aberto",
          "limites",
          "atlas",
          "precisao",
          "conta",
        ].includes(f.id),
      )
    : publicFaqs;
  return (
    <div className="divide-y divide-border border-y border-border">
      {items.map((item) => (
        <details
          id={`faq-${item.id}`}
          key={item.id}
          className="group scroll-mt-24"
        >
          <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-5 py-5 text-left text-sm font-medium transition-colors hover:text-foreground/75 sm:text-base [&::-webkit-details-marker]:hidden">
            {item.question}
            <Plus
              className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-45 motion-reduce:transition-none"
              aria-hidden="true"
            />
          </summary>
          <p className="max-w-3xl pb-6 pr-6 text-sm leading-relaxed text-muted-foreground">
            {item.answer}
            {item.link && (
              <a
                href={item.link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 block w-fit text-foreground underline underline-offset-4 transition-opacity hover:opacity-70"
              >
                {item.link.label}
              </a>
            )}
          </p>
        </details>
      ))}
    </div>
  );
}
