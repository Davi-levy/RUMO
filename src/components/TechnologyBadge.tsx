import { LanguageIcon } from "@/components/LanguageIcon";
import { getTechnologies } from "@/lib/tech-icons";

export function TechnologyBadge({ language }: { language: string }) {
  const technologies = getTechnologies(language);
  const nome = language.trim();
  const parecePedido = nome.split(/\s+/).length > 4 || /^(como\b|quero\b|aprenda\b|aprender\b|crie\b|criar\b|me ensine\b|ensine\b)/i.test(nome);
  const labels = technologies.length ? technologies.slice(0, 3).map(technology => technology.name)
    : [nome && !parecePedido ? nome : "Programação"];
  const hidden = technologies.slice(3).map(technology => technology.name);
  return (
    <span className="inline-flex min-w-0 max-w-full flex-wrap items-center gap-2 text-xs font-normal normal-case tracking-normal text-muted-foreground">
      {labels.map(label => (
        <span key={label} className="inline-flex max-w-full items-center gap-1.5 border border-border px-2 py-1">
          <LanguageIcon language={label} originalColors />
          <span className="break-words min-w-0">{label}</span>
        </span>
      ))}
      {hidden.length > 0 && (
        <span className="text-base" title={hidden.join(", ")} aria-label={`Mais tecnologias: ${hidden.join(", ")}`}>
          +
        </span>
      )}
    </span>
  );
}
