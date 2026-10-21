import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import type { DemoLesson } from "@/lib/public-content";

export function DemoTutor({ lesson }: { lesson: DemoLesson }) {
  const [active, setActive] = useState<number | null>(null);
  return (
    <section
      aria-label="Demonstração do Rumo Atlas"
      className="border border-border bg-[#050505]"
    >
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <img src="/icons/rumo.svg" alt="" width={23} height={20} />
        <h3 className="text-sm font-medium">Rumo Atlas</h3>
        <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">
          Demonstração
        </span>
      </div>
      <div className="p-5 sm:p-6">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Uma dúvida também pode ser um próximo passo. Escolha uma pergunta
          sobre este exemplo.
        </p>
        <div className="mt-5 flex flex-col items-start gap-2">
          {lesson.tutor.map((item, i) => (
            <button
              type="button"
              key={item.question}
              onClick={() => setActive(i)}
              aria-pressed={active === i}
              className={`flex w-full cursor-pointer items-center justify-between gap-3 border px-3 py-3 text-left text-xs leading-relaxed transition-colors hover:border-foreground/50 ${active === i ? "border-foreground/60 text-foreground" : "border-border text-muted-foreground"}`}
            >
              {item.question}
              <ArrowUpRight
                className="h-3.5 w-3.5 shrink-0"
                aria-hidden="true"
              />
            </button>
          ))}
        </div>
        <div aria-live="polite" aria-atomic="true">
          {active !== null && (
            <div className="mt-6 border-t border-border pt-5">
              <p className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                Atlas · resposta de exemplo
              </p>
              <p className="text-sm leading-relaxed">
                {lesson.tutor[active].answer}
              </p>
            </div>
          )}
        </div>
        <p className="mt-6 text-[11px] leading-relaxed text-muted-foreground">
          Respostas fixas para experimentar. Na sua trilha, o Atlas recebe o
          contexto do módulo e responde com IA.
        </p>
      </div>
    </section>
  );
}
